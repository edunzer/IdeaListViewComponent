import { LightningElement, api, wire, track } from 'lwc';
import getIdeasWithVotes from '@salesforce/apex/IdeaListViewComponentController.getIdeasWithVotes';
import handleUpVote from '@salesforce/apex/IdeaListViewComponentController.handleUpVote';
import handleDownVote from '@salesforce/apex/IdeaListViewComponentController.handleDownVote';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const columns = [
    {
        label: 'Subject',
        fieldName: 'ideaUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'subject' },
        },
        initialWidth: 380, // Adjust the width as needed
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
    {
        label: '',
        fieldName: 'upVoteCount',
        type: 'number',
        initialWidth: 10, // Adjust the width as needed
        cellAttributes: { alignment: 'center' }
    },
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
        label: '',
        fieldName: 'downVoteCount',
        type: 'number',
        initialWidth: 10, // Adjust the width as needed
        cellAttributes: { alignment: 'center' }
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
    @api title = 'Most Popular Ideas';
    @api sourceType = 'All';
    @api sortField = 'Total_Votes__c';
    @api sortOrder = 'DESC';
    @api statusFilter = '';

    @track ideas = [];
    @track columns = columns;
    @track error;
    @track page = 1; // Default page
    @track pageSize = 10; // Default page size
    @track totalRecords = 0; // Total records returned by the server
    @track totalPage = 1;

    wiredIdeasResult;

    @wire(getIdeasWithVotes, { 
        sourceType: '$sourceType', 
        sortField: '$sortField', 
        sortOrder: '$sortOrder', 
        statusFilter: '$statusFilter',
        pageSize: '$pageSize',
        pageNumber: '$page'
    })
    wiredIdeas(result) {
        this.wiredIdeasResult = result;
        const { data, error } = result;

        if (data) {
            console.log('Data received from Apex:', data);

            this.totalRecords = data.totalRecords;
            console.log('Total Records:', this.totalRecords);

            this.updateTotalPages();

            console.log('Total Pages:', this.totalPage);
            console.log('Current Page:', this.page);

            // Reset the page to 1 if the current page exceeds the totalPage after filtering
            if (this.page > this.totalPage) {
                console.log(`Current page (${this.page}) is greater than total pages (${this.totalPage}), resetting to page 1.`);
                this.page = 1;
                refreshApex(this.wiredIdeasResult); // Refresh to load data for the first page
            } else {
                this.ideas = data.ideas.map(ideaWrapper => {
                    let upVoteVariant = '';
                    let downVoteVariant = '';

                    if (ideaWrapper.userVote) {
                        if (ideaWrapper.userVote.Type__c === 'Up') {
                            upVoteVariant = 'brand';
                        } else if (ideaWrapper.userVote.Type__c === 'Down') {
                            downVoteVariant = 'brand';
                        }
                    }

                    return {
                        ideaId: ideaWrapper.idea.Id,
                        ideaUrl: `/ideaexchange/s/idea/${ideaWrapper.idea.Id}`,
                        productTagName: ideaWrapper.idea.Product_Tag__r.Name,
                        productTagUrl: `/ideaexchange/s/adm-product-tag/${ideaWrapper.idea.Product_Tag__c}`,
                        status: ideaWrapper.idea.Status__c,
                        subject: ideaWrapper.idea.Subject__c,
                        upVoteCount: ideaWrapper.idea.Up__c,
                        downVoteCount: ideaWrapper.idea.Down__c,
                        upVoteVariant,
                        downVoteVariant,
                    };
                });
            }

            this.error = undefined;
        } else if (error) {
            console.error('Error fetching ideas:', error);
            this.error = error;
            this.ideas = [];
        }
    }

    updateTotalPages() {
        this.totalPage = Math.ceil(this.totalRecords / this.pageSize);
        console.log('Total Pages after update:', this.totalPage);
    }

    get isPreviousDisabled() {
        const disabled = this.page === 1;
        console.log('Is Previous Disabled:', disabled);
        return disabled;
    }

    get isNextDisabled() {
        const disabled = this.page === this.totalPage || this.totalPage === 0;
        console.log('Is Next Disabled:', disabled);
        return disabled;
    }

    handlePrevious() {
        if (this.page > 1) {
            this.page -= 1;
            console.log('Navigating to previous page:', this.page);
            refreshApex(this.wiredIdeasResult);
        }
    }

    handleNext() {
        if (this.page < this.totalPage) {
            this.page += 1;
            console.log('Navigating to next page:', this.page);
            refreshApex(this.wiredIdeasResult);
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
