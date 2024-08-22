public with sharing class IdeaVotingController {

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
}
