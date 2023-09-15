# Simple Templates

JavaScript is a scripting language and a Turing-complete one to boot. We don't really need logic inside our templates to make them useful; you can already do that with JavaScript. What we really need is a simple way to express our templates and the ability to build larger templates from smaller ones or reach into smaller sections of larger templates.





## Installation

```console
$ npm install @vlence/simple-templates
```





## Usage

WARNING: Simple Templates does NOT sanitize your inputs. Sanitizing your inputs is your responsibility.


### Expression blocks

```javascript
const {compile, Template} = require('@vlence/simple-templates')

const template_str = 'hello {{name}}!'
const template = compile(template_str)
console.log(template.render({name: 'world'})) // hello world!

// same as above but imperative
const imperative_template = new Template()
imperative_template.add_string('hello ')
imperative_template.add_expression('name')
imperative_template.add_string('!')
console.log(imperative_template.render({name: 'world'})) // hello world!
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


### Template blocks

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
const {compile, Template} = require('@vlence/simple-templates')

const template = compile(fs.readFileSync('form.html'))
console.log(template.render()) // <form> ... </form>
console.log(template.render('UsernameInput')) // <input ... />

// The above could be done programmatically too
const outer = new Template()
const inner = new Template('UsernameInput')

inner.add_string('<input ... />')

outer.add_string('<form> ...')
outer.add_template(inner)
outer.add_string('... </form>')

console.log(outer.render()) // <form> ... </form>
console.log(outer.render('UsernameInput')) // <input ... />
```

Template blocks look like `{{template TemplateName}} ... {{/template}}`. Just like expression blocks `TemplateName` must contain only alphanumeric characters and _, and may not start with a digit.

Use template blocks to isolate portions of a template. This is useful when you want to render only a part of a template instead of the whole. This approach may be nicer compared to having many smaller templates and combining them manually. For example, you're using htmx and you perform input validation on the server. Instead of having multiple templates for each form field you can have one template with the complete form and render just the field being validated.


#### `only()`, `except()`, `some()`

There are situations where we don't want to render an entire template but rather just a portion of it. To achieve this we can mark these sections using template blocks and render them conditionally.

Let's explore this. Consider the following template.

```javascript
const templateString = `Outside.
{{template greeting_generic}}hello!{{/template}}
{{template greeting_personalized}}hello {{name}}!{{/template}}.`

const template = compile(templateString)
```

Using `only()` we can render some templates and nothing else.

```javascript
template.only('greeting_generic') // 'hello!'
template.only('greeting_personalized', {name: 'world'}) // 'hello world!'
template.only(['greeting_generic', {name: 'greeting_personalized', context: {name: 'world'}}]) // 'hello!hello world!'
```

`except()` works a little bit like a blacklist. All content OUTSIDE the templates specified will also be rendered. 

```javascript
template.except('greeting_personalized') // 'Outside.\nhello!\n'
template.except(['greeting_personalized']) // 'Outside.\nhello!\n'
template.except(['greeting_personalized', 'greeting_generic']) // 'Outside.\n\n'
template.except('greeting_generic', {name: 'world'}) // 'Outside.\n\nhello world!'
template.except(['greeting_generic'], {name: 'world'}) // 'Outside.\n\nhello world!'
```

`some()` works like the opposite of `except()`.

```javascript
template.some('greeting_generic') // 'Outside.\nhello!\n'
template.some('greeting_personalized', {name: 'world'}) // 'Outside.\n\nhello world!'
template.some([{name: 'greeting_personalized', context: {name: 'world'}}]) // 'Outside.\n\nhello world!'
template.some(['greeting_generic', {name: 'greeting_personalized', context: {name: 'world'}}]) // 'Outside.\nhello!\nhello world!'
```





## Examples

Here are some examples

### Express

```html
<!-- templates/layout.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Templates Example</title>
</head>
<body>
    {{ body }}
</body>
</html>
```

```html
<!-- templates/home.html -->
<h1>It works!</h1>
```

```javascript
// server.js
const fs = require('fs')
const express = require('express')
const {compile} = require('@vlence/simple-templates')

const layout_template = compile(fs.readFileSync('templates/layout.html').toString())
const home_template = compile(fs.readFileSync('templates/home.html').toString())

const app = express()

app.use(function (req, res) {
    res.setHeader('content-type', 'text/html')
    res.send(layout_template.render({
        body: home_template.render()
    }))
})

app.listen(8080, function (err) {
    if (err) {
        console.error('Failed to start server at 127.0.0.1:8080')
        console.error(err)
        process.exit(1)
    }

    console.log('Listening at 127.0.0.1:8080')
})
```