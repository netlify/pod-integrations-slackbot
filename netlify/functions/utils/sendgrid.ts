import sendgrid from '@sendgrid/mail';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY as string);

/*
 * Heads up: this SendGrid account cannot send from @netlify.com emails. I
 * started looking into it and the security implications just made me tired.
 * The @ntl.fyi domain is verified, so just use that.
 *
 * Also, this SendGrid account texts Jason Lengstorf with a security code. It
 * probably shouldn’t but this is where we’re at. It won’t matter unless you
 * want to change the template, which is as bare bones as I could make it.
 */

export async function sendSendgridEmail({
  to = 'jason.lengstorf@netlify.com',
  from = 'noreply@ntl.fyi',
  subject = 'DX Newsletter',
  lede,
  html,
  context,
}: {
  to: string;
  from: string;
  subject: string;
  lede: string;
  html: string;
  context: string;
}) {
  await sendgrid.send({
    templateId: 'd-c135605a79da424396ffebd9e840020f',
    dynamicTemplateData: {
      subject,
      greeting: lede,
      content: html,
      context,
    },
    to,
    from,
  });
}
