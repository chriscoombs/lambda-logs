const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const cloudwatch = new AWS.CloudWatch();
const lambda = new AWS.Lambda();

const {
  dashboardName,
} = process.env;

// Optional blacklists
const functionsBlacklist = (process.env.functionsBlacklist) ? process.env.functionsBlacklist.split(',') : [];
const widgetsBlacklist = (process.env.widgetsBlacklist) ? process.env.widgetsBlacklist.split(',') : [];

const listFunctions = (functions = [], marker) => new Promise((resolve, reject) => {
  const params = (marker) ? { Marker: marker } : {};
  lambda.listFunctions(params).promise()
    .then((data) => {
      if (data.NextMarker) {
        resolve(listFunctions(functions.concat(data.Functions), data.NextMarker));
      } else {
        resolve(functions.concat(data.Functions));
      }
    })
    .catch((err) => {
      if (err.code === 'ThrottlingException' || err.code === 'TooManyRequestsException') {
        setTimeout(() => {
          resolve(listFunctions(functions, marker));
        }, 1000);
      } else {
        reject(err);
      }
    });
});

const mergeDashboardWithFunctions = (dashboard, lambdaFunctions) => {
  const updatedDashboard = dashboard;
  const updatedWidgets = [];
  updatedDashboard.widgets.forEach((widget) => {
    if (widget.type === 'metric' && !widgetsBlacklist.includes(widget.properties.title)) {
      const metrics = [];
      const metricTemplate = widget.properties.metrics[0];
      if (metricTemplate[0] === 'AWS/Lambda' && metricTemplate.length > 3) {
        lambdaFunctions.forEach((lambdaFunction) => {
          const functionMetric = metricTemplate.slice(0);
          functionMetric[3] = lambdaFunction.FunctionName;
          metrics.push(functionMetric);
        });
        const updatedWidget = widget;
        updatedWidget.properties.metrics = metrics.slice(0, 100);
        updatedWidgets.push(updatedWidget);
      }
    }
  });
  return updatedDashboard;
};

const handler = (event, context, callback) => {
  Promise.resolve()
    .then(() => Promise.all([
      cloudwatch.getDashboard({
        DashboardName: dashboardName,
      }).promise(),
      listFunctions(),
    ]))
    .then((data) => {
      const lambdaFunctions = data[1].filter(lambdaFunction => !functionsBlacklist.includes(lambdaFunction.FunctionName) && lambdaFunction.FunctionName !== context.functionName); // eslint-disable-line max-len
      const dashboardBody = mergeDashboardWithFunctions(JSON.parse(data[0].DashboardBody), lambdaFunctions); // eslint-disable-line max-len
      return cloudwatch.putDashboard({
        DashboardName: dashboardName,
        DashboardBody: JSON.stringify(dashboardBody),
      }).promise();
    })
    .then(() => {
      callback(null);
    })
    .catch((err) => {
      callback(err);
    });
};

module.exports = {
  mergeDashboardWithFunctions,
  handler,
};
