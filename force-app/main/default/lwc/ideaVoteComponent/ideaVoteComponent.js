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

    @wire(getIdeasWithVotes)
    wiredIdea(result) {
        console.log('Wired method called with result:', result);
        this.wiredIdeaResult = result;

        if (result.data) {
            console.log('Data received:', result.data);
            this.idea = result.data.find(ideaWrapper => ideaWrapper.idea.Id === this.recordId);

            if (this.idea) {
                console.log('Idea found with recordId:', this.recordId, 'Idea data:', this.idea);
                this.updateVoteClasses();
            } else {
                console.warn('No idea found with recordId:', this.recordId);
                console.log('Available Idea IDs:', result.data.map(ideaWrapper => ideaWrapper.idea.Id));
            }

            this.error = undefined;
        } else if (result.error) {
            console.error('Error fetching ideas:', result.error);
            this.error = result.error;
            this.idea = undefined;
        } else {
            console.log('No data and no error. This might be a transient state.');
        }
    }

    updateVoteClasses() {
        console.log('Updating vote classes for idea:', this.idea);
        if (this.idea && this.idea.userVote) {
            if (this.idea.userVote.Type__c === 'Up') {
                console.log('User has Up vote for this idea.');
                this.upVoteClass = 'icon-button active';
                this.upVoteVariant = 'inverse';
                this.downVoteClass = 'icon-button';
                this.downVoteVariant = 'bare';
            } else if (this.idea.userVote.Type__c === 'Down') {
                console.log('User has Down vote for this idea.');
                this.upVoteClass = 'icon-button';
                this.upVoteVariant = 'bare';
                this.downVoteClass = 'icon-button active';
                this.downVoteVariant = 'inverse';
            }
        } else {
            console.log('User has no votes for this idea.');
            this.upVoteClass = 'icon-button';
            this.downVoteClass = 'icon-button';
            this.upVoteVariant = 'bare';
            this.downVoteVariant = 'bare';
        }
    }

    handleUpVote() {
        console.log('Upvote button clicked for recordId:', this.recordId);
        const initialVoteType = this.idea && this.idea.userVote ? this.idea.userVote.Type__c : null;

        handleUpVote({ ideaId: this.recordId })
            .then(() => {
                let message;
                if (initialVoteType === 'Up') {
                    message = 'Upvote removed successfully';
                    console.log('Upvote removed for recordId:', this.recordId);
                } else if (initialVoteType === 'Down') {
                    message = 'Vote changed to Upvote successfully';
                    console.log('Vote changed to Upvote for recordId:', this.recordId);
                } else {
                    message = 'Upvoted successfully';
                    console.log('Upvoted successfully for recordId:', this.recordId);
                }
                this.showToast('Success', message, 'success');
                return refreshApex(this.wiredIdeaResult);
            })
            .then(() => {
                this.updateVoteClasses();
            })
            .catch(error => {
                console.error('Error handling upvote:', error);
                this.showToast('Error', 'Error upvoting: ' + error.body.message, 'error');
            });
    }

    handleDownVote() {
        console.log('Downvote button clicked for recordId:', this.recordId);
        const initialVoteType = this.idea && this.idea.userVote ? this.idea.userVote.Type__c : null;

        handleDownVote({ ideaId: this.recordId })
            .then(() => {
                let message;
                if (initialVoteType === 'Down') {
                    message = 'Downvote removed successfully';
                    console.log('Downvote removed for recordId:', this.recordId);
                } else if (initialVoteType === 'Up') {
                    message = 'Vote changed to Downvote successfully';
                    console.log('Vote changed to Downvote for recordId:', this.recordId);
                } else {
                    message = 'Downvoted successfully';
                    console.log('Downvoted successfully for recordId:', this.recordId);
                }
                this.showToast('Success', message, 'success');
                return refreshApex(this.wiredIdeaResult);
            })
            .then(() => {
                this.updateVoteClasses();
            })
            .catch(error => {
                console.error('Error handling downvote:', error);
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
