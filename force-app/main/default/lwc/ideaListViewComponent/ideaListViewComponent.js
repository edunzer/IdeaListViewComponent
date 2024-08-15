import { LightningElement, api, wire } from 'lwc';
import getIdeasWithVotes from '@salesforce/apex/IdeaListViewComponentController.getIdeasWithVotes';

export default class IdeaListViewComponent extends LightningElement {
    @api title = 'Most Popular Ideas';
    ideas = [];
    error;

    @wire(getIdeasWithVotes)
    wiredIdeas({ error, data }) {
        console.log('wiredIdeas method called');

        if (data) {
            console.log('Raw data returned from Apex:', data);

            this.ideas = data.map(ideaWrapper => {
                let upVoteVariant = '';
                let downVoteVariant = '';

                if (ideaWrapper.userVote) {
                    if (ideaWrapper.userVote.Type__c === 'Up') {
                        upVoteVariant = 'brand'; // Apply 'brand' variant for upvote
                        console.log(`Upvote processed for Idea ID: ${ideaWrapper.idea.Id}`);
                    } else if (ideaWrapper.userVote.Type__c === 'Down') {
                        downVoteVariant = 'brand'; // Apply 'brand' variant for downvote
                        console.log(`Downvote processed for Idea ID: ${ideaWrapper.idea.Id}`);
                    }
                } else {
                    console.log(`No vote data for Idea ID: ${ideaWrapper.idea.Id}`);
                }

                const ideaId = ideaWrapper.idea.Id;
                const productTagId = ideaWrapper.idea.Product_Tag__c;
                const submittedById = ideaWrapper.idea.Submitted_By__c;

                const processedIdeaWrapper = {
                    ...ideaWrapper,
                    upVoteVariant,
                    downVoteVariant,
                    ideaUrl: `/ideaexchange/s/idea/${ideaId}`,
                    productTagUrl: `/ideaexchange/s/adm-product-tag/${productTagId}`,
                    submittedByUrl: `/ideaexchange/s/profile/${submittedById}`
                };

                console.log('Processed Idea Wrapper:', processedIdeaWrapper);
                return processedIdeaWrapper;
            });

            console.log('Final ideas array:', this.ideas);
            this.error = undefined;
        } else if (error) {
            console.error('Error returned from Apex:', error);
            this.error = error;
            this.ideas = [];
        }
    }

    handleUpVote(event) {
        const ideaId = event.currentTarget.dataset.id;
        console.log('Upvote for Idea:', ideaId);
    }

    handleDownVote(event) {
        const ideaId = event.currentTarget.dataset.id;
        console.log('Downvote for Idea:', ideaId);
    }
}
