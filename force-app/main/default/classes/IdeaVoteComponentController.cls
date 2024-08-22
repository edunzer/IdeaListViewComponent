public with sharing class IdeaVoteComponentController {

    @AuraEnabled(cacheable=true)
    public static IdeaWrapper getIdeaWithVotes(Id recordId) {
        Id currentUserId = UserInfo.getUserId();

        // Check if recordId is null
        if (recordId == null) {
            throw new AuraHandledException('Record ID is null. Cannot fetch Idea.');
        }

        try {
            // Query to get the idea record based on recordId
            Idea__c idea = [SELECT Id, Name, Product_Tag__c, Product_Tag__r.Name, Status__c, Subject__c, Submitted_By__c, Submitted_By__r.Name, Up__c, Down__c 
                            FROM Idea__c 
                            WHERE Id = :recordId 
                            LIMIT 1];

            // Query to get the vote associated with the current user for this idea
            Idea_Vote__c userVote;
            try {
                userVote = [SELECT Id, Idea__c, Type__c FROM Idea_Vote__c 
                            WHERE Idea__c = :idea.Id 
                            AND Submitted_By__c = :currentUserId 
                            LIMIT 1];
            } catch (Exception e) {
                userVote = null; // If no vote found, set it to null
            }

            // Wrap the Idea and associated vote in an IdeaWrapper
            IdeaWrapper ideaWrapper = new IdeaWrapper(idea, userVote);

            return ideaWrapper;

        } catch (Exception e) {
            // Log the error and throw a handled exception to the client
            System.debug('Error in getIdeaWithVotes: ' + e.getMessage());
            throw new AuraHandledException('Error in getIdeaWithVotes: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void handleUpVote(Id ideaId) {
        IdeaVotingController.handleUpVote(ideaId);
    }

    @AuraEnabled
    public static void handleDownVote(Id ideaId) {
        IdeaVotingController.handleDownVote(ideaId);
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
