### No Raw SQL Without Sanitization
When using `query()` or `$db->rawQuery()`, placeholders shall be used. Building SQL via string concatenation is prohibited.

### Fat Model, Skinny Controller
Business logic shall reside in Models. Controllers shall not contain business logic.

### Validate Before Save
Models shall define validation rules via `beforeSave` or `$validate`. Calling `save()` without validation is prohibited.

### No Direct Session Manipulation
Direct access to `$_SESSION` is prohibited. Use `CakeSession` instead.
