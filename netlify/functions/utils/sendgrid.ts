import sendgrid from '@sendgrid/mail';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function sendSendgridEmail({
  to = 'jason.lengstorf@netlify.com',
  from = 'noreply@ntl.fyi',
  subject = 'DX Newsletter',
  lede,
  html,
}) {
  await sendgrid.send({
    templateId: 'd-c135605a79da424396ffebd9e840020f',
    dynamicTemplateData: {
      subject,
      greeting: lede,
      content: html,
    },
    to,
    from,
  });
}
