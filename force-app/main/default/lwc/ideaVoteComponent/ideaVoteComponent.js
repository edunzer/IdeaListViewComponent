import { LightningElement, api, wire } from 'lwc';
import handleUpVote from '@salesforce/apex/IdeaListViewComponentController.handleUpVote';
import handleDownVote from '@salesforce/apex/IdeaListViewComponentController.handleDownVote';
import getIdeasWithVotes from '@salesforce/apex/IdeaListViewComponentController.getIdeasWithVotes';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class IdeaVoteComponent extends LightningElement {
    @api recordId; // Receives the record ID of the Idea

    idea;
    upVoteVariant = '';
    downVoteVariant = '';
    wiredIdeaResult;

    @wire(getIdeasWithVotes, { sourceType: 'CurrentUser', sortField: 'Total_Votes__c', sortOrder: 'DESC' })
    wiredIdea(result) {
        this.wiredIdeaResult = result;
        if (result.data) {
            this.idea = result.data.find(ideaWrapper => ideaWrapper.idea.Id === this.recordId);
            if (this.idea) {
                this.updateVoteVariants();
            }
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.idea = undefined;
        }
    }

    updateVoteVariants() {
        if (this.idea && this.idea.userVote) {
            this.upVoteVariant = this.idea.userVote.Type__c === 'Up' ? 'brand' : '';
            this.downVoteVariant = this.idea.userVote.Type__c === 'Down' ? 'brand' : '';
        } else {
            this.upVoteVariant = '';
            this.downVoteVariant = '';
        }
    }

    handleUpVote() {
        handleUpVote({ ideaId: this.recordId })
            .then(() => {
                this.showToast('Success', 'Upvoted successfully', 'success');
                return refreshApex(this.wiredIdeaResult);
            })
            .then(() => {
                this.updateVoteVariants(); // Ensure the variants are updated after refresh
            })
            .catch(error => {
                this.showToast('Error', 'Error upvoting: ' + error.body.message, 'error');
            });
    }

    handleDownVote() {
        handleDownVote({ ideaId: this.recordId })
            .then(() => {
                this.showToast('Success', 'Downvoted successfully', 'success');
                return refreshApex(this.wiredIdeaResult);
            })
            .then(() => {
                this.updateVoteVariants(); // Ensure the variants are updated after refresh
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
