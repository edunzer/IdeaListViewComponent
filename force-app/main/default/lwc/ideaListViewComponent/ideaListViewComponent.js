import { LightningElement, api, wire } from 'lwc';
import getIdeasWithVotes from '@salesforce/apex/IdeaListViewComponentController.getIdeasWithVotes';
import handleUpVote from '@salesforce/apex/IdeaListViewComponentController.handleUpVote';
import handleDownVote from '@salesforce/apex/IdeaListViewComponentController.handleDownVote';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class IdeaListViewComponent extends LightningElement {
    @api title = 'Most Popular Ideas'; // Title set from the property in the .js-meta.xml
    @api sourceType = 'All'; // Default to showing all ideas
    @api sortField = 'Total_Votes__c'; // Default sort field
    @api sortOrder = 'DESC'; // Default sort order (descending)
    @api statusFilter = ''; // New status filter property

    ideas = [];
    error;
    wiredIdeasResult;

    @wire(getIdeasWithVotes, { sourceType: '$sourceType', sortField: '$sortField', sortOrder: '$sortOrder', statusFilter: '$statusFilter' })
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
        const ideaWrapper = this.ideas.find(idea => idea.idea.Id === ideaId);
        const initialVoteType = ideaWrapper && ideaWrapper.userVote ? ideaWrapper.userVote.Type__c : null;

        handleUpVote({ ideaId })
            .then(() => {
                let message;
                if (initialVoteType === 'Up') {
                    message = 'Upvote removed successfully';
                } else if (initialVoteType === 'Down') {
                    message = 'Vote changed to Upvote successfully';
                } else {
                    message = 'Upvoted successfully';
                }
                this.showToast('Success', message, 'success');
                return refreshApex(this.wiredIdeasResult);
            })
            .catch(error => {
                this.showToast('Error', 'Error upvoting: ' + error.body.message, 'error');
            });
    }

    handleDownVote(event) {
        const ideaId = event.currentTarget.dataset.id;
        const ideaWrapper = this.ideas.find(idea => idea.idea.Id === ideaId);
        const initialVoteType = ideaWrapper && ideaWrapper.userVote ? ideaWrapper.userVote.Type__c : null;

        handleDownVote({ ideaId })
            .then(() => {
                let message;
                if (initialVoteType === 'Down') {
                    message = 'Downvote removed successfully';
                } else if (initialVoteType === 'Up') {
                    message = 'Vote changed to Downvote successfully';
                } else {
                    message = 'Downvoted successfully';
                }
                this.showToast('Success', message, 'success');
                return refreshApex(this.wiredIdeasResult);
            })
            .catch(error => {
                this.showToast('Error', 'Error downvoting: ' + error.body.message, 'error');
            });
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
}
