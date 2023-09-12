# Simple Templates

JavaScript is a scripting language and a Turing-complete one to boot. We don't really need logic inside our templates to make them useful; you can already do that with JavaScript. What we really need is a simple way to express our templates and the ability to build larger templates from smaller ones or reach into smaller sections of larger templates.

## Installation

```console
$ npm install @vlence/simple-templates
```

## Usage

### Basic usage

```javascript
const {compile, Template} = require('@vlence/simple-templates')

const templateString = 'hello {{name}}!'
const template = compile(templateString)
console.log(template.render({name: 'world'})) // hello world!

// same as above but imperative
const imperativeTemplate = new Template()
imperativeTemplate.add_string('hello ')
imperativeTemplate.add_expression('name')
imperativeTemplate.add_string('!')
console.log(imperativeTemplate.render({name: 'world'})) // hello world!
```

Expression blocks look like `{{ expression }}`. `expression` must contain only alphanumeric characters and _, and may not start with a digit.

Valid:
- `{{ city }}`
- `{{ _an_expression }}`
- `{{ DoYouLikeJokes_ }}`
- `{{ l3375P34k }}`

Invalid:
- `{{ 123no }}`
- `{{ }}`

### Nested templates

```html
<!-- form.html -->
<form action="/login" method="post">
    <label for="username">Username:</label>
    {{template UsernameInput}}
        <input type="text" id="username" name="username" required autofocus />
    {{/template}}

    <button type="submit">Login</button>
</form>
```

```javascript
const fs = require('fs')
const {compile} = require('@vlence/simple-templates')

const template = compile(fs.readFileSync('form.html'))
console.log(template.render()) // <form> ... </form>
console.log(template.render('UsernameInput')) // <input ... />
```

Template blocks look like `{{template TemplateName}} ... {{/template}}`. Just like expression blocks `TemplateName` must contain only alphanumeric characters and _, and may not start with a digit.

Use template blocks to isolate portions of a template. This is useful when you want to render only a part of a template instead of the whole. This approach may be nicer compared