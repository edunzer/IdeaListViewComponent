import { LightningElement, api, wire, track } from 'lwc';
import handleUpVote from '@salesforce/apex/IdeaVoteComponentController.handleUpVote';
import handleDownVote from '@salesforce/apex/IdeaVoteComponentController.handleDownVote';
import getIdeaWithVotes from '@salesforce/apex/IdeaVoteComponentController.getIdeaWithVotes';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class IdeaVoteComponent extends LightningElement {
    @api recordId;
    @track isLoading = true; // Add a loading state
    idea;
    upVoteClass = 'icon-button'; // Default class
    downVoteClass = 'icon-button'; // Default class
    wiredIdeaResult;

    connectedCallback() {
        console.log('IdeaVoteComponent connected. Record ID:', this.recordId);
    }

    @wire(getIdeaWithVotes, { recordId: '$recordId' })
    wiredIdea(result) {
        console.log('Wired method called. Record ID:', this.recordId);
        
        if (!this.recordId) {
            console.warn('Record ID is not set. Skipping data fetch.');
            return;
        }
    
        this.wiredIdeaResult = result;
    
        if (result.data) {
            this.isLoading = false; // Stop loading indicator
            this.idea = result.data;
    
            if (this.idea) {
                this.updateVoteClasses();
            } else {
                console.warn('No idea found with recordId:', this.recordId);
            }
    
            this.error = undefined;
        } else if (result.error) {
            this.isLoading = false; // Stop loading indicator
            console.error('Error fetching idea:', result.error);
            this.logErrorDetails(result.error);
            this.error = result.error;
            this.idea = undefined;
        } else {
            console.log('No data and no error. This might be a transient state.');
        }
    }
    

    logErrorDetails(error) {
        if (error) {
            console.error('Error status:', error.status);
            console.error('Error message:', error.body ? error.body.message : 'No message');
            console.error('Error details:', JSON.stringify(error));
        }
    }

    updateVoteClasses() {
        if (this.idea && this.idea.userVote) {
            if (this.idea.userVote.Type__c === 'Up') {
                this.upVoteClass = 'icon-button active';
                this.upVoteVariant = 'inverse';
                this.downVoteClass = 'icon-button';
                this.downVoteVariant = 'bare';
            } else if (this.idea.userVote.Type__c === 'Down') {
                this.upVoteClass = 'icon-button';
                this.upVoteVariant = 'bare';
                this.downVoteClass = 'icon-button active';
                this.downVoteVariant = 'inverse';
            }
        } else {
            this.upVoteClass = 'icon-button';
            this.downVoteClass = 'icon-button';
            this.upVoteVariant = 'bare';
            this.downVoteVariant = 'bare';
        }
        console.log('Updated vote classes:', this.upVoteClass, this.downVoteClass);
    }

    handleUpVote() {
        const initialVoteType = this.idea && this.idea.userVote ? this.idea.userVote.Type__c : null;

        handleUpVote({ ideaId: this.recordId })
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
        const initialVoteType = this.idea && this.idea.userVote ? this.idea.userVote.Type__c : null;

        handleDownVote({ ideaId: this.recordId })
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
        console.log('Show toast:', title, message, variant);
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
}
