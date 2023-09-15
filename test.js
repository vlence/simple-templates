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
assert.throws(() => compile(`invalid expression {{template}}`))
assert.throws(() => compile(`invalid expression {{template Invalid}}`))
assert.throws(() => compile(`invalid expression {{/template}}`))
assert.throws(() => compile(`invalid expression {{template}} {{/template}}`))
assert.throws(() => compile('invalid expression {{template BLOCK}}{{/template}}{{/template}}'))



// can it compile and render template blocks?
template = compile('{{template OuterTemplate}} Outer {{template InnerTemplate}} Inner {{/template}} Outer {{/template}}')
assert.equal(template.render(), ' Outer  Inner  Outer ')
assert.equal(template.render('OuterTemplate'), ' Outer  Inner  Outer ')
assert.equal(template.render('InnerTemplate'), ' Inner ')

template = compile('{{template ONE}}one{{/template}} {{template TWO}}two{{/template}}')
assert.equal(template.render(), 'one two')
assert.equal(template.render('ONE'), 'one')
assert.equal(template.render('TWO'), 'two')

template = compile(`Outside.
{{template greeting_generic}}hello!{{/template}}
{{template greeting_personalized}}hello {{name}}!{{/template}}`)

assert.equal(template.only('greeting_generic'), 'hello!')
assert.equal(template.only({name: 'greeting_personalized', context: {name: 'world'}}), 'hello world!')
assert.equal(template.only('greeting_generic', {name: 'greeting_personalized', context: {name: 'world'}}), 'hello!hello world!')

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
template = compile('{{outerMessage}} {{template Inner}}{{innerMessage}}{{/template}}')
assert.equal(template.render({outerMessage: 'outer', innerMessage: 'inner'}), 'outer inner')
assert.equal(template.render('Inner', {outerMessage: 'outer', innerMessage: 'inner'}), 'inner')



console.log('ok')