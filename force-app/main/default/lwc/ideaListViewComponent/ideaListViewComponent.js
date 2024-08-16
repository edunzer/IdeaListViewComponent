import { LightningElement, api, wire } from 'lwc';
import getIdeasWithVotes from '@salesforce/apex/IdeaListViewComponentController.getIdeasWithVotes';
import handleUpVote from '@salesforce/apex/IdeaListViewComponentController.handleUpVote';
import handleDownVote from '@salesforce/apex/IdeaListViewComponentController.handleDownVote';
import { refreshApex } from '@salesforce/apex';

export default class IdeaListViewComponent extends LightningElement {
    @api title = 'Most Popular Ideas';
    ideas = [];
    error;
    wiredIdeasResult;

    @wire(getIdeasWithVotes)
    wiredIdeas(result) {
        this.wiredIdeasResult = result;
        const { data, error } = result;
        if (data) {
            this.ideas = data.map(ideaWrapper => {
                let upVoteVariant = '';
                let downVoteVariant = '';

                if (ideaWrapper.userVote) {
                    if (ideaWrapper.userVote.Type__c === 'Up') {
                        upVoteVariant = 'brand'; // Highlight upvote
                    } else if (ideaWrapper.userVote.Type__c === 'Down') {
                        downVoteVariant = 'brand'; // Highlight downvote
                    }
                }

                const ideaId = ideaWrapper.idea.Id;
                const productTagId = ideaWrapper.idea.Product_Tag__c;
                const submittedById = ideaWrapper.idea.Submitted_By__c;

                return {
                    ...ideaWrapper,
                    upVoteVariant,
                    downVoteVariant,
                    ideaUrl: `/ideaexchange/s/idea/${ideaId}`,
                    productTagUrl: `/ideaexchange/s/adm-product-tag/${productTagId}`,
                    submittedByUrl: `/ideaexchange/s/profile/${submittedById}`
                };
            });

            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.ideas = [];
        }
    }

    handleUpVote(event) {
        const ideaId = event.currentTarget.dataset.id;
        handleUpVote({ ideaId })
            .then(() => {
                return refreshApex(this.wiredIdeasResult);
            })
            .catch(error => {
                console.error('Error handling upvote:', error);
            });
    }

    handleDownVote(event) {
        const ideaId = event.currentTarget.dataset.id;
        handleDownVote({ ideaId })
            .then(() => {
                return refreshApex(this.wiredIdeasResult);
            })
            .catch(error => {
                console.error('Error handling downvote:', error);
            });
    }
}
