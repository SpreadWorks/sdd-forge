<!-- {%guardrail {phase: [draft, spec]}%} -->
### Security Impact Disclosure
Changes affecting authentication, authorization, or input validation shall explicitly state their security impact in the spec.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [draft, spec]}%} -->
### Migration Required for Schema Changes
Changes involving database schema modifications shall include a migration plan in the spec.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [spec, impl]}%} -->
### Input Sanitization Required
Changes handling user input shall specify countermeasures against SQL injection, XSS, path traversal, and similar attacks in the spec.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [spec, impl]}%} -->
### No Reinventing Framework Features
When the framework provides a built-in feature, custom implementations of the same functionality are prohibited.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [impl]}%} -->
### No Sensitive Data in Logs
Logs shall not contain passwords, tokens, or personally identifiable information. Sensitive data shall be masked or excluded.
<!-- {%/guardrail%} -->
