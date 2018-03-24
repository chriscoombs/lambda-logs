# Lambda Logging Functions

## log-subscriber

Automatically subscribes /aws/lambda prefixed log groups to a destinationArn provided by the user. NOTE: The user must provide the relevant permissions to the log shipper.

# log-shipper

An example of a cross account log shipper, using Kinesis and a placeholder log shipping function (to be replaced by the user).