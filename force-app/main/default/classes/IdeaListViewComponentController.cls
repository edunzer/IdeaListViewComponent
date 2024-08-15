public with sharing class IdeaListViewComponentController {
    @AuraEnabled(cacheable=true)
    public static List<IdeaWrapper> getIdeasWithVotes() {
        Id currentUserId = UserInfo.getUserId();

        // Step 1: Query all Ideas
        List<Idea__c> ideas = [SELECT Id, Name, Product_Tag__c, Product_Tag__r.Name, Status__c, Subject__c, Submitted_By__c, Submitted_By__r.Name
                               FROM Idea__c
                               ORDER BY Total_Votes__c DESC
                               LIMIT 100];

        // Step 2: Collect all Idea IDs
        Set<Id> ideaIds = new Set<Id>();
        for (Idea__c idea : ideas) {
            ideaIds.add(idea.Id);
        }

        // Step 3: Query all IdeaVotes related to the Ideas
        Map<Id, Idea_Vote__c> ideaVotesMap = new Map<Id, Idea_Vote__c>();
        if (!ideaIds.isEmpty()) {
            for (Idea_Vote__c vote : [SELECT Id, Idea__c, Type__c, Submitted_By__c
                                      FROM Idea_Vote__c 
                                      WHERE Submitted_By__c = :currentUserId 
                                      AND Idea__c IN :ideaIds]) {
                ideaVotesMap.put(vote.Idea__c, vote);
            }
        }

        // Step 4: Wrap the Ideas and associate the votes
        List<IdeaWrapper> ideaList = new List<IdeaWrapper>();
        for (Idea__c idea : ideas) {
            Idea_Vote__c userVote = ideaVotesMap.get(idea.Id);
            ideaList.add(new IdeaWrapper(idea, userVote));
        }

        return ideaList;
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
