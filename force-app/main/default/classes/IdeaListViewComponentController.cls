public with sharing class IdeaListViewComponentController {

    // Existing method to get ideas with votes
    @AuraEnabled(cacheable=true)
    public static List<IdeaWrapper> getIdeasWithVotes() {
        Id currentUserId = UserInfo.getUserId();

        List<Idea__c> ideas = [SELECT Id, Name, Product_Tag__c, Product_Tag__r.Name, Status__c, Subject__c, Submitted_By__c, Submitted_By__r.Name, Up__c, Down__c 
                               FROM Idea__c
                               ORDER BY Total_Votes__c DESC
                               LIMIT 100];

        Set<Id> ideaIds = new Set<Id>();
        for (Idea__c idea : ideas) {
            ideaIds.add(idea.Id);
        }

        Map<Id, Idea_Vote__c> ideaVotesMap = new Map<Id, Idea_Vote__c>();
        if (!ideaIds.isEmpty()) {
            for (Idea_Vote__c vote : [SELECT Id, Idea__c, Type__c, Submitted_By__c
                                      FROM Idea_Vote__c 
                                      WHERE Submitted_By__c = :currentUserId 
                                      AND Idea__c IN :ideaIds]) {
                ideaVotesMap.put(vote.Idea__c, vote);
            }
        }

        List<IdeaWrapper> ideaList = new List<IdeaWrapper>();
        for (Idea__c idea : ideas) {
            Idea_Vote__c userVote = ideaVotesMap.get(idea.Id);
            ideaList.add(new IdeaWrapper(idea, userVote));
        }

        return ideaList;
    }

    // Method to handle upvote
    @AuraEnabled
    public static void handleUpVote(Id ideaId) {
        Id currentUserId = UserInfo.getUserId();
        Idea_Vote__c existingVote;

        try {
            existingVote = [SELECT Id, Type__c FROM Idea_Vote__c WHERE Idea__c = :ideaId AND Submitted_By__c = :currentUserId LIMIT 1];
        } catch (QueryException e) {
            existingVote = null;
        }

        if (existingVote != null) {
            if (existingVote.Type__c == 'Up') {
                // If the existing vote is already an upvote, delete it
                delete existingVote;
            } else {
                // If the existing vote is a downvote, update it to an upvote
                existingVote.Type__c = 'Up';
                update existingVote;
            }
        } else {
            // Create a new upvote record
            Idea_Vote__c newVote = new Idea_Vote__c(
                Idea__c = ideaId,
                Type__c = 'Up',
                Submitted_By__c = currentUserId
            );
            insert newVote;
        }
    }

    // Method to handle downvote
    @AuraEnabled
    public static void handleDownVote(Id ideaId) {
        Id currentUserId = UserInfo.getUserId();
        Idea_Vote__c existingVote;

        try {
            existingVote = [SELECT Id, Type__c FROM Idea_Vote__c WHERE Idea__c = :ideaId AND Submitted_By__c = :currentUserId LIMIT 1];
        } catch (QueryException e) {
            existingVote = null;
        }

        if (existingVote != null) {
            if (existingVote.Type__c == 'Down') {
                // If the existing vote is already a downvote, delete it
                delete existingVote;
            } else {
                // If the existing vote is an upvote, update it to a downvote
                existingVote.Type__c = 'Down';
                update existingVote;
            }
        } else {
            // Create a new downvote record
            Idea_Vote__c newVote = new Idea_Vote__c(
                Idea__c = ideaId,
                Type__c = 'Down',
                Submitted_By__c = currentUserId
            );
            insert newVote;
        }
    }

    // Wrapper class to return Idea and associated IdeaVote
    public class IdeaWrapper {
        @AuraEnabled public Idea__c idea { get; set; }
        @AuraEnabled public Idea_Vote__c userVote { get; set; }

        public IdeaWrapper(Idea__c idea, Idea_Vote__c userVote) {
            this.idea = idea;
            this.userVote = userVote;
        }
    }
}
