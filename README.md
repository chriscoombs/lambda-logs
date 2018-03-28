# Lambda Logging Functions

## log-subscriber

Automatically subscribes the logs of new Lambda functions to a destinationArn provided by the user (e.g. Lambda). NOTE: The user must provide the relevant permissions to the log shipper.

## metrics-dashboard

Automatically adds new Lambda functions to metric widgets on a CloudWatch dashboard.

## log-shipper (ADDING SOON)

An example of a cross account log shipper, using Kinesis and a placeholder log shipping function (to be replaced by the user).