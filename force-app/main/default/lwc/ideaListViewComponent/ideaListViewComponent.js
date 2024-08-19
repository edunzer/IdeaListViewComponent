import { LightningElement, api, wire } from 'lwc';
import getIdeasWithVotes from '@salesforce/apex/IdeaListViewComponentController.getIdeasWithVotes';
import handleUpVote from '@salesforce/apex/IdeaListViewComponentController.handleUpVote';
import handleDownVote from '@salesforce/apex/IdeaListViewComponentController.handleDownVote';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const columns = [
    {
        label: 'Idea Name',
        fieldName: 'ideaUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'ideaName' },
        },
    },
    {
        label: 'Product',
        fieldName: 'productTagUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'productTagName' },
        },
    },
    { label: 'Status', fieldName: 'status', type: 'text' },
    { label: 'Subject', fieldName: 'subject', type: 'text',initialWidth: 380 },
    {
        label: 'Up',
        type: 'button-icon',
        initialWidth: 60, // Adjust the width as needed
        typeAttributes: {
            iconName: 'utility:like',
            variant: { fieldName: 'upVoteVariant' },
            name: 'upvote',
            alternativeText: 'Up Vote',
            title: 'Up Vote',
        },
    },
    {
        label: 'Down',
        type: 'button-icon',
        initialWidth: 60, // Adjust the width as needed
        typeAttributes: {
            iconName: 'utility:dislike',
            variant: { fieldName: 'downVoteVariant' },
            name: 'downvote',
            alternativeText: 'Down Vote',
            title: 'Down Vote',
        },
    },
];

export default class IdeaListViewComponent extends LightningElement {
    @api title = 'Most Popular Ideas'; // Title set from the property in the .js-meta.xml
    @api sourceType = 'All'; // Default to showing all ideas
    @api sortField = 'Total_Votes__c'; // Default sort field
    @api sortOrder = 'DESC'; // Default sort order (descending)
    @api statusFilter = ''; // New status filter property

    ideas = [];
    columns = columns;
    error;
    wiredIdeasResult;

    @wire(getIdeasWithVotes, { sourceType: '$sourceType', sortField: '$sortField', sortOrder: '$sortOrder', statusFilter: '$statusFilter' })
    wiredIdeas(result) {
        console.log('Wired method called with result:', result);
        this.wiredIdeasResult = result;
        const { data, error } = result;
        if (data) {
            console.log('Data received:', data);
            this.ideas = data.map(ideaWrapper => {
                let upVoteVariant = '';
                let downVoteVariant = '';

                if (ideaWrapper.userVote) {
                    if (ideaWrapper.userVote.Type__c === 'Up') {
                        upVoteVariant = 'brand'; // Highlight upvote
                        console.log('Idea ID', ideaWrapper.idea.Id, 'has an Up vote.');
                    } else if (ideaWrapper.userVote.Type__c === 'Down') {
                        downVoteVariant = 'brand'; // Highlight downvote
                        console.log('Idea ID', ideaWrapper.idea.Id, 'has a Down vote.');
                    }
                }

                return {
                    ideaId: ideaWrapper.idea.Id,
                    ideaName: ideaWrapper.idea.Name,
                    ideaUrl: `/ideaexchange/s/idea/${ideaWrapper.idea.Id}`,
                    productTagName: ideaWrapper.idea.Product_Tag__r.Name,
                    productTagUrl: `/ideaexchange/s/adm-product-tag/${ideaWrapper.idea.Product_Tag__c}`,
                    status: ideaWrapper.idea.Status__c,
                    subject: ideaWrapper.idea.Subject__c,
                    upVoteVariant,
                    downVoteVariant,
                };
            });

            console.log('Processed ideas:', this.ideas);
            this.error = undefined;
        } else if (error) {
            console.error('Error fetching ideas:', error);
            this.error = error;
            this.ideas = [];
        }
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const ideaId = event.detail.row.ideaId;

        if (actionName === 'upvote') {
            this.handleUpVote(ideaId);
        } else if (actionName === 'downvote') {
            this.handleDownVote(ideaId);
        }
    }
    

    handleUpVote(ideaId) {
        console.log('Upvote button clicked for Idea ID:', ideaId);
        const ideaWrapper = this.ideas.find(idea => idea.ideaId === ideaId);
        const initialVoteType = ideaWrapper && ideaWrapper.userVote ? ideaWrapper.userVote.Type__c : null;

        handleUpVote({ ideaId })
            .then(() => {
                let message;
                if (initialVoteType === 'Up') {
                    message = 'Upvote removed successfully';
                    console.log('Upvote removed for Idea ID:', ideaId);
                } else if (initialVoteType === 'Down') {
                    message = 'Vote changed to Upvote successfully';
                    console.log('Vote changed to Upvote for Idea ID:', ideaId);
                } else {
                    message = 'Upvoted successfully';
                    console.log('Upvoted successfully for Idea ID:', ideaId);
                }
                this.showToast('Success', message, 'success');
                return refreshApex(this.wiredIdeasResult);
            })
            .catch(error => {
                console.error('Error handling upvote:', error);
                this.showToast('Error', 'Error upvoting: ' + error.body.message, 'error');
            });
    }

    handleDownVote(ideaId) {
        console.log('Downvote button clicked for Idea ID:', ideaId);
        const ideaWrapper = this.ideas.find(idea => idea.ideaId === ideaId);
        const initialVoteType = ideaWrapper && ideaWrapper.userVote ? ideaWrapper.userVote.Type__c : null;

        handleDownVote({ ideaId })
            .then(() => {
                let message;
                if (initialVoteType === 'Down') {
                    message = 'Downvote removed successfully';
                    console.log('Downvote removed for Idea ID:', ideaId);
                } else if (initialVoteType === 'Up') {
                    message = 'Vote changed to Downvote successfully';
                    console.log('Vote changed to Downvote for Idea ID:', ideaId);
                } else {
                    message = 'Downvoted successfully';
                    console.log('Downvoted successfully for Idea ID:', ideaId);
                }
                this.showToast('Success', message, 'success');
                return refreshApex(this.wiredIdeasResult);
            })
            .catch(error => {
                console.error('Error handling downvote:', error);
                this.showToast('Error', 'Error downvoting: ' + error.body.message, 'error');
            });
    }

    showToast(title, message, variant) {
        console.log('Show toast:', title, message, variant);
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }
}
