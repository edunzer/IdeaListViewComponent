# Idea Management Components

## Overview
The Idea Management components (IdeaListViewComponent and IdeaVoteComponent) are Salesforce Lightning Web Components (LWCs) designed to manage and interact with ideas within a Salesforce ORG. These components allow users to view, upvote, and downvote ideas, providing a dynamic and interactive way to engage with idea records. They leverage a combination of Apex controllers and custom Lightning Web Components to deliver efficient functionality.

**Key features include:**
- Dynamic Idea Retrieval and Display: The components fetch and display ideas with associated vote information, allowing users to easily interact with ideas directly within the application.
- Upvoting and Downvoting: Users can upvote or downvote ideas, with the components reflecting the current vote state.
   Pagination: The IdeaListViewComponent supports pagination to efficiently handle large sets of ideas, ensuring smooth user experience.
- Filtering and Sorting: Ideas can be filtered and sorted based on various criteria, making it easy for users to find and prioritize ideas.

## Features

**Real-time Data Fetching**
- Immediate Data Load: Ideas are fetched from the Salesforce backend as soon as the components are loaded.
- Pagination: Pagination is implemented in IdeaListViewComponent to handle large datasets, allowing users to navigate through pages of ideas.
- Sorting and Filtering: Ideas can be sorted and filtered based on user preferences, ensuring the most relevant ideas are displayed.

**Voting Functionality**
- Upvote/Downvote: Users can upvote or downvote ideas, with visual indicators showing the current state of the vote.
- Vote Management: The backend logic handles voting operations, ensuring that only one vote per user is allowed per idea.

**User Experience Enhancements**
- Dynamic UI Updates: The components dynamically update based on user interactions, such as voting or navigating between pages.
- Error Handling: Graceful error handling ensures that users are informed of any issues, such as problems with data retrieval or vote submission.

![Screenshot 2024-08-29 123642](https://github.com/user-attachments/assets/a62d82d6-f1bf-4c76-beb2-96412b0b8d38)

## Documentation
For more detailed information about these components, please check out the [Wiki](https://github.com/edunzer/IdeaListViewComponent/wiki) for this repository. It includes comprehensive documentation such as:

- [A Component Overview](https://github.com/edunzer/IdeaListViewComponent/wiki)
- [Details about the IdeaListViewComponent HTML](https://github.com/edunzer/IdeaListViewComponent/wiki/IdeaListViewComponent-HTML)
- [Details about the IdeaVoteComponent HTML](https://github.com/edunzer/IdeaListViewComponent/wiki/IdeaVoteComponent-HTML)
- [Details about the IdeaListViewComponent Javascript](https://github.com/edunzer/IdeaListViewComponent/wiki/IdeaListViewComponent-JavaScript)
- [Details about the IdeaVoteComponent Javascript](https://github.com/edunzer/IdeaListViewComponent/wiki/IdeaVoteComponent-JavaScript)
- [Details about the IdeaListViewComponentController](https://github.com/edunzer/IdeaListViewComponent/wiki/IdeaListViewComponentController)
- [Details about the IdeaVoteComponentController](https://github.com/edunzer/IdeaListViewComponent/wiki/IdeaVoteComponentController)
