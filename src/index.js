const { Logging } = require('@google-cloud/logging');
const { WebClient } = require('@slack/web-api');

const logging = new Logging();
const log = logging.log('cloudfunctions.googleapis.com/cloud-functions');

const sendInvite = async (req, res) => {
  const { email, first_name: firstName, last_name: lastName } = req.body;
  const referer = req.headers.Referer;
  // const bearerToken = process.env.NODE_ENV !== 'test' ? process.env.BEARER_TOKEN : 'test_token';
  // const authorizationHeader = req.headers.Authorization;
  //
  // if (!authorizationHeader || authorizationHeader !== `Bearer ${bearerToken}`) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  const realName = `${firstName} ${lastName}`;

  try {
    const params = {
      channel_ids: process.env.SLACK_CHANNEL_IDS, // required
      team_id: process.env.SLACK_TEAM_ID, // required
      email, // required
      email_password_policy_enabled: true,
      real_name: realName || '',
    };

    const slackToken = process.env.NODE_ENV === 'test' ? process.env.FAKE_TOKEN : process.env.SLACK_USER_TOKEN;
    const web = new WebClient(slackToken);

    const inviteResult = await web.admin.users.invite({
      ...params,
    });

    if (process.env.NODE_ENV !== 'test') {
      await log.write({
        severity: 'info',
        message: `Invitation successfully sent! Name: ${realName}, Email: ${email}`,
        labels: { function_name: process.env.FUNCTION_NAME },
        httpRequest: {
          referer,
        },
      });
    }

    // Send a message to the specified channel
    const messageResult = await web.chat.postMessage({
      channel: process.env.SLACK_MESSAGE_CHANNEL,
      text: `*Invitation successfully sent!*\n:white_check_mark: Name: ${realName}\n:white_check_mark: Email: ${email}`,
      mrkdwn: true,
    });

    return res.status(200).json({ message: 'Invite sent successfully', inviteResult, messageResult });
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      await log.write({
        severity: 'error',
        message: `Error sending invite: ${error.message}`,
        labels: { function_name: process.env.FUNCTION_NAME },
        httpRequest: {
          referer,
        },
      });

      // Send error notification to Slack
      const slackToken = process.env.NODE_ENV === 'test' ? process.env.FAKE_TOKEN : process.env.SLACK_USER_TOKEN;
      const web = new WebClient(slackToken);

      const messageResult = await web.chat.postMessage({
        channel: process.env.SLACK_MESSAGE_CHANNEL,
        text: `<!here> :exclamation: :exclamation: :exclamation:\n*ERROR SENDING INVITE*:\nName: ${realName}\nEmail: ${email}\nError: ${error.message}`,
        mrkdwn: true,
      });
      console.error(`Error sent to Slack channel: ${process.env.SLACK_MESSAGE_CHANNEL}, Message: `, messageResult);
    }
    return res.status(500).json({ error: `Error sending invite: ${error.message}` });
  }
};

module.exports = { sendInvite };
