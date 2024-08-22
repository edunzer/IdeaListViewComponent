public with sharing class IdeaListViewComponentController {

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getIdeasWithVotes(String sourceType, String sortField, String sortOrder, String statusFilter, Id recordId, Integer pageSize, Integer pageNumber) {
        Id currentUserId = UserInfo.getUserId();
        Integer offset = (pageNumber - 1) * pageSize;

        // Base query for ideas
        String baseQuery = 'SELECT Id, Name, Product_Tag__c, Product_Tag__r.Name, Status__c, Subject__c, Submitted_By__c, Submitted_By__r.Name, Up__c, Down__c FROM Idea__c';
        String countQuery = 'SELECT COUNT() FROM Idea__c';
        List<Idea__c> ideas;
        Integer totalRecords;

        try {
            String whereClause = '';
            if (recordId != null) {
                whereClause = ' WHERE Id = :recordId';
            } else if (sourceType == 'CurrentUser') {
                whereClause = ' WHERE Submitted_By__c = :currentUserId';
            } else {
                whereClause = ' WHERE Id != NULL'; // Ensures WHERE clause is always valid
            }

            // Apply status filter if provided and valid
            if (statusFilter != null && !String.isBlank(statusFilter)) {
                List<String> statusList = statusFilter.split(',');
                if (!statusList.isEmpty()) {
                    whereClause += ' AND Status__c IN :statusList';
                }
            }

            // Append the whereClause to both queries
            baseQuery += whereClause;
            countQuery += whereClause;

            // Apply sorting and pagination
            baseQuery += ' ORDER BY ' + sortField + ' ' + sortOrder + ' LIMIT :pageSize OFFSET :offset';

            // Execute the queries
            ideas = Database.query(baseQuery);

            // Execute the count query to get the total number of records
            totalRecords = Database.countQuery(countQuery);  // Changed from SOQL to countQuery

            // Collect idea IDs for further processing
            Set<Id> ideaIds = new Set<Id>();
            for (Idea__c idea : ideas) {
                ideaIds.add(idea.Id);
            }

            // Map to hold votes related to the ideas
            Map<Id, Idea_Vote__c> ideaVotesMap = new Map<Id, Idea_Vote__c>();
            if (!ideaIds.isEmpty()) {
                for (Idea_Vote__c vote : [SELECT Id, Idea__c, Type__c, Submitted_By__c
                                          FROM Idea_Vote__c 
                                          WHERE Submitted_By__c = :currentUserId 
                                          AND Idea__c IN :ideaIds]) {
                    ideaVotesMap.put(vote.Idea__c, vote);
                }
            }

            // Wrap the Ideas and associate the votes
            List<IdeaWrapper> ideaList = new List<IdeaWrapper>();
            for (Idea__c idea : ideas) {
                Idea_Vote__c userVote = ideaVotesMap.get(idea.Id);
                ideaList.add(new IdeaWrapper(idea, userVote));
            }

            // Prepare the return map
            Map<String, Object> resultMap = new Map<String, Object>();
            resultMap.put('ideas', ideaList);
            resultMap.put('totalRecords', totalRecords);

            return resultMap;
        } catch (Exception e) {
            // Log the error and throw a handled exception to the client
            System.debug('Error in getIdeasWithVotes: ' + e.getMessage());
            throw new AuraHandledException('Error in getIdeasWithVotes: ' + e.getMessage());
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
