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
    error;

    @wire(getIdeasWithVotes, { sourceType: 'CurrentUser', sortField: 'Total_Votes__c', sortOrder: 'DESC' })
    wiredIdea(result) {
        if (result.data) {
            this.idea = result.data.find(ideaWrapper => ideaWrapper.idea.Id === this.recordId);
            if (this.idea) {
                if (this.idea.userVote) {
                    if (this.idea.userVote.Type__c === 'Up') {
                        this.upVoteVariant = 'brand';
                    } else if (this.idea.userVote.Type__c === 'Down') {
                        this.downVoteVariant = 'brand';
                    }
                }
            }
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.idea = undefined;
        }
    }

    handleUpVote() {
        handleUpVote({ ideaId: this.recordId })
            .then(() => {
                this.showToast('Success', 'Upvoted successfully', 'success');
                return refreshApex(this.wiredIdea);
            })
            .catch(error => {
                this.showToast('Error', 'Error upvoting: ' + error.body.message, 'error');
            });
    }

    handleDownVote() {
        handleDownVote({ ideaId: this.recordId })
            .then(() => {
                this.showToast('Success', 'Downvoted successfully', 'success');
                return refreshApex(this.wiredIdea);
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
