import { LightningElement, api, wire } from 'lwc';
import handleUpVote from '@salesforce/apex/IdeaListViewComponentController.handleUpVote';
import handleDownVote from '@salesforce/apex/IdeaListViewComponentController.handleDownVote';
import getIdeasWithVotes from '@salesforce/apex/IdeaListViewComponentController.getIdeasWithVotes';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class IdeaVoteComponent extends LightningElement {
    @api recordId;

    idea;
    upVoteClass = 'icon-button'; // Default class
    downVoteClass = 'icon-button'; // Default class
    wiredIdeaResult;

    @wire(getIdeasWithVotes, { sourceType: 'CurrentUser', sortField: 'Total_Votes__c', sortOrder: 'DESC' })
    wiredIdea(result) {
        this.wiredIdeaResult = result;
        if (result.data) {
            this.idea = result.data.find(ideaWrapper => ideaWrapper.idea.Id === this.recordId);
            if (this.idea) {
                this.updateVoteClasses();
            }
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.idea = undefined;
        }
    }

    updateVoteClasses() {
        if (this.idea && this.idea.userVote) {
            // Determine the state for the upvote button
            if (this.idea.userVote.Type__c === 'Up') {
                this.upVoteClass = 'icon-button active';
                this.upVoteVariant = 'inverse';
                this.downVoteClass = 'icon-button';
                this.downVoteVariant = 'bare';
            } 
            // Determine the state for the downvote button
            else if (this.idea.userVote.Type__c === 'Down') {
                this.upVoteClass = 'icon-button';
                this.upVoteVariant = 'bare';
                this.downVoteClass = 'icon-button active';
                this.downVoteVariant = 'inverse';
            }
        } else {
            // No vote, both buttons are in their default state
            this.upVoteClass = 'icon-button';
            this.downVoteClass = 'icon-button';
            this.upVoteVariant = 'bare';
            this.downVoteVariant = 'bare';
        }
    }           

    handleUpVote() {
        handleUpVote({ ideaId: this.recordId })
            .then(() => {
                this.showToast('Success', 'Upvoted successfully', 'success');
                return refreshApex(this.wiredIdeaResult);
            })
            .then(() => {
                this.updateVoteClasses();
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
                this.updateVoteClasses();
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
