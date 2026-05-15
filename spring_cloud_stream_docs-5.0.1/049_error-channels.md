# Error Channels

Starting with version 1.3, the binder unconditionally sends exceptions to an error channel for each consumer destination and can also be configured to send async producer send failures to an error channel.
See [this section on error handling](../../spring-cloud-stream/overview-error-handling.html) for more information.

The payload of the `ErrorMessage` for a send failure is a `KafkaSendFailureException` with properties:

* `failedMessage`: The Spring Messaging `Message<?>` that failed to be sent.
* `record`: The raw `ProducerRecord` that was created from the `failedMessage`

There is no automatic handling of producer exceptions (such as sending to a [dead letter topic](dlq.html)).
You can consume these exceptions with your own Spring Integration flow.