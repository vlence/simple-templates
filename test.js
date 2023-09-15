const assert = require('assert')
const {compile, Template} = require('./simple-templates')



// can it compile and render whitespace?
let template = compile('')
assert.equal(template.render(), '')

template = compile('            \n\n\n\n\n  \n     \n')
assert.equal(template.render(), '            \n\n\n\n\n  \n     \n')



// can it compile and render templates without any blocks?
template = compile('hello world')
assert.equal(template.render(), 'hello world')
assert.equal(template.render({key: 'value'}), 'hello world')




// can it compile and render expression blocks?
template = compile('hello {{name}}!')
assert.equal(template.render(), 'hello !')
assert.equal(template.render({}), 'hello !')
assert.equal(template.render({name: null}), 'hello !')
assert.equal(template.render({name: 'world'}), 'hello world!')



// does it throw when it encounters invalid blocks?
assert.throws(() => compile(`invalid expression {{}}`))
assert.throws(() => compile(`invalid expression {{t}}`))
assert.throws(() => compile(`invalid expression {{t Invalid}}`))
assert.throws(() => compile(`invalid expression {{/t}}`))
assert.throws(() => compile(`invalid expression {{t}} {{/t}}`))
assert.throws(() => compile('invalid expression {{t BLOCK}}{{/t}}{{/t}}'))



// can it compile and render template blocks?
template = compile('{{t OuterTemplate}} Outer {{t InnerTemplate}} Inner {{/t}} Outer {{/t}}')
assert.equal(template.render(), ' Outer  Inner  Outer ')

template = compile('{{t ONE}}one{{/t}} {{t TWO}}two{{/t}}')
assert.equal(template.render(), 'one two')

template = compile(`Outside.
{{t greeting_generic}}hello!{{/t}}
{{t greeting_personalized}}hello {{name}}!{{/t}}`)

assert.equal(template.only('greeting_generic'), 'hello!')
assert.equal(template.only('greeting_personalized', {name: 'world'}), 'hello world!')
assert.equal(template.only(['greeting_generic', {name: 'greeting_personalized', context: {name: 'world'}}]), 'hello!hello world!')

assert.equal(template.except('greeting_personalized'), 'Outside.\nhello!\n')
assert.equal(template.except(['greeting_personalized']), 'Outside.\nhello!\n')
assert.equal(template.except(['greeting_personalized', 'greeting_generic']), 'Outside.\n\n')
assert.equal(template.except('greeting_generic', {name: 'world'}), 'Outside.\n\nhello world!')
assert.equal(template.except(['greeting_generic'], {name: 'world'}), 'Outside.\n\nhello world!')

assert.equal(template.some('greeting_generic'), 'Outside.\nhello!\n')
assert.equal(template.some('greeting_personalized', {name: 'world'}), 'Outside.\n\nhello world!')
assert.equal(template.some([{name: 'greeting_personalized', context: {name: 'world'}}]), 'Outside.\n\nhello world!')
assert.equal(template.some(['greeting_generic', {name: 'greeting_personalized', context: {name: 'world'}}]), 'Outside.\nhello!\nhello world!')



// putting it all together
template = compile('{{outerMessage}} {{t Inner}}{{innerMessage}}{{/t}}')
assert.equal(template.render({outerMessage: 'outer', innerMessage: 'inner'}), 'outer inner')
assert.equal(template.only('Inner', {outerMessage: 'outer', innerMessage: 'inner'}), 'inner')



console.log('ok')