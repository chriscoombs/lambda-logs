const AWS = require('aws-sdk'); // eslint-disable-line import/no-unresolved

const cloudwatchlogs = new AWS.CloudWatchLogs();

// Log shipper ARN
const {
  destinationArn,
  filterPattern
} = process.env;

const isShippableLogGroup = (logGroupName, context) =>
  // Only subscribe to lambda log groups
  logGroupName.indexOf('/aws/lambda') > -1 &&
  // Ignore the log subscriber function's log group
  logGroupName !== context.logGroupName &&
  // Ignore if log shipping function is Lambda
  destinationArn.indexOf('arn:aws:lambda') > -1 ? logGroupName !== `/aws/lambda/${destinationArn.substring(destinationArn.indexOf(':function:') + 10).split(':')[0]}` : true;

exports.handler = (event, context, callback) => {
  const {
    logGroupName,
  } = event.detail.requestParameters;
  if (isShippableLogGroup(logGroupName, context)) {
    const params = {
      destinationArn,
      filterName: 'log-shipper',
      filterPattern,
      logGroupName,
    };
    cloudwatchlogs.putSubscriptionFilter(params).promise()
      .then(() => callback(null))
      .catch((err) => {
        callback(err);
      });
  } else {
    callback(null);
  }
};
