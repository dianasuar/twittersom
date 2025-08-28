export const markdownDocumentSchema = {
    name: 'markdownDocument',
    type: 'document',
    fields: [
      {
        name: 'title',
        type: 'string',
      },
      {
        name: 'body',
        type: 'markdown',
      },
    ],
  };