/**
 * 
 * @typedef {Object} TemplateArgument
 * @property {string} name The name of the template
 * @property {any} context The context of the template
 */

/**
 * @typedef {Object} Token
 * @property {string} type The type of token
 * @property {string} value The value of the token
 */


/**
 * A compiled template. Templates can be rendered into strings.
 * 
 * @example
 * ```javascript
 * const compile = require('@vlence/simple-templates')
 * const templateString = 'hello {{name}}!'
 * const template = compile(templateString)
 * template.render({name: 'world'}) // hello world!
 * ```
 */
class Template {
    constructor(name = '__ROOT__') {
        /**
         * @readonly
         */
        this.name = name

        /**
         * @private
         * @type {Token[]}
         */
        this._tokens = []

        /**
         * @private
         * @type {{[name: string]: Template;}}
         */
        this._templates_map = {}

        /**
         * @private
         * @type {Template[]}
         */
        this._templates_list = []
    }

    /**
     * Add string to this template's rendering pipeline.
     * 
     * @param {string} s 
     */
    add_string(s) {
        this._tokens.push({type: 'String', value: s})
    }

    /**
     * Add expression to this template's rendering pipeline.
     * 
     * @param {string} e The name of the expression
     */
    add_expression(e) {
        this._tokens.push({type: 'Expression', value: e})
    }

    /**
     * Add template to this template's rendering pipeline.
     * 
     * @param {Template} t A template
     */
    add_template(t) {
        this._tokens.push({type: 'Template', value: t.name})
        this._templates_map[t.name] = t
        this._templates_list.push(t)
    }

    /**
     * Render this template with the given context.
     * 
     * `undefined` and `null` are not rendered.
     * 
     * @param {any} context The context for this render
     * 
     * @returns {string} The rendered template.
     */
    render(context = {}) {
        let output = ''
        
        for (const token of this._tokens) {
            output += this._render_token(token, context)
        }

        return output
    }

    /**
     * Render only some templates inside this template.
     * 
     * @example
     * ```javascript
     * const templateString = `
     * This is outside all other templates. Notice this text never gets rendered
     * when you use only().
     * 
     * {{t greeting_generic}} hello! {{/t}}
     * {{t greeting_personalized}} hello {{name}}! {{/t}}
     * `
     * 
     * const template = compile(templateString)
     * 
     * console.log(template.only('greeting_generic')) // hello!
     * console.log(template.only({name: 'greeting_personalized', context: {name: 'world'}})) // hello world!
     * console.log(template.only('greeting_generic', {name: 'greeting_personalized', context: {name: 'world'}})) // hello! hello world!
     * ```
     * 
     * @param {string|(string|TemplateArgument)[]} nameOrList The list of templates to render
     * @param {any} context The rendering context. This is used only if the first argument is a string.
     * 
     * @returns {string} The rendered templates
     */
    only(nameOrList, context = {}) {
        let output = ''
        const isList = Array.isArray(nameOrList)

        if (isList && nameOrList.length == 0) {
            return output
        }

        if (!isList) {
            return this._render_token({type: 'Template', value: nameOrList}, context)
        }

        for (const t of this._templates_list) {
            for (const item of nameOrList) {
                const itemType = typeof item == 'string' ? 'string' : 'TemplateArgument'
                const name = itemType == 'string' ? item : item.name

                if (t.name === name) {
                    output += t.render(item.context)
                }
            }
        }
        
        return output
    }

    /**
     * Render everything in this template except some templates
     * 
     * @example
     * ```javascript
     * const templateString = `
     * This is outside all other templates. Notice this text never gets rendered
     * when you use only().
     * 
     * {{t greeting_generic}} hello! {{/t}}
     * {{t greeting_personalized}} hello {{name}}! {{/t}}
     * `
     * 
     * const template = compile(templateString)
     * 
     * console.log(template.only('greeting_generic')) // hello!
     * console.log(template.only({name: 'greeting_personalized', context: {name: 'world'}})) // hello world!
     * console.log(template.only('greeting_generic', {name: 'greeting_personalized', context: {name: 'world'}})) // hello! hello world!
     * ```
     * 
     * @param {string|string[]} nameOrList The list of templates to render
     * 
     * @returns {string} The rendered templates
     */
    except(nameOrList, context = {}) {
        let output = ''
        const isList = Array.isArray(nameOrList)

        if (isList && nameOrList.length == 0) {
            return output
        }


        token_loop: for (const token of this._tokens) {
            if (token.type == 'Template') {
                if (!isList) {
                    if (token.value === nameOrList) {
                        continue token_loop
                    }
                }
                
                for (const name of nameOrList) {
                    if (token.value === name) {
                        continue token_loop
                    }
                }
            }

            output += this._render_token(token, context)
        }
        
        return output
    }

    /**
     * Render some of the templates, and everything outside them, in this template.
     * 
     * @example
     * ```javascript
     * 
     * ```
     * 
     * @param {string|Array<string|TemplateArgument>} nameOrList The list of templates to render
     * @param {any} context The rendering context for expression blocks outside the list of templates to render
     * 
     * @returns {string} The rendered templates
     */
    some(nameOrList, context = {}) {
        let output = ''

        const isList = Array.isArray(nameOrList)

        if (isList && nameOrList.length == 0) {
            return output
        }

        token_loop: for (const token of this._tokens) {
            if (token.type == 'Template') {
                if (isList) {
                    for (const item of nameOrList) {
                        const itemType = typeof item == 'string' ? 'string' : 'TemplateArgument'
                        const name = itemType == 'string' ? item : item.name
                        
                        if (token.value === name) {
                            output += this._render_token(token, item.context || context)
                            continue token_loop
                        }
                    }
                }

                if (token.value !== nameOrList) {
                    continue
                }
            }

            output += this._render_token(token, context)
        }
        
        return output
    }

    /**
     * 
     * @param {Token} token The token to render
     * @param {any} context The rendering context
     */
    _render_token(token, context) {
        switch (token.type) {
            case 'String':
                return token.value
                
            case 'Expression':
                const expr = context[token.value]
                
                // don't render undefined and null
                if (expr === undefined || expr === null) {
                    return ''
                }

                return expr
                
            case 'Template':
                const template = this._find(token.value)

                if (template) {
                    return template.render(context)
                }

                return ''
        }
    }

    /**
     * Finds the template with the given name.
     * 
     * @private
     * 
     * @param {string} name Name of the template
     * 
     * @returns {Template|undefined} The template or `undefined`
     */
    _find(name) {
        if (this.name === name) {
            return this
        }
        
        if (this._templates_list.length === 0) {
            return undefined
        }
        
        if (this._templates_map[name] !== undefined) {
            return this._templates_map[name]
        }

        for (const t of this._templates_list) {
            const found = t._find(name)

            if (found) {
                return found
            }
        }

        return undefined
    }
}

/**
 * Takes a string and generates a list of tokens lazily.
 * 
 * The tokens represent strings, expression blocks and template
 * blocks.
 * 
 * @example
 * ```javascript
 * const {Tokenizer} = require('@vlence/simple-templates')
 * 
 * const templateString = 'hello {{name}}!'
 * const tokenizer = new Tokenizer(templateString)
 * 
 * while (tokenizer.hasMoreTokens()) {
 *     tokenizer.getNextToken()
 * }
 * ```
 */
class Tokenizer {
    /**
     * 
     * @param {string} s The string to tokenize 
     */
    constructor(s) {
        this._string = s
        this._cursor = 0
    }

    hasMoreTokens() {
        return this._cursor < this._string.length
    }

    getNextToken() {
        if (!this.hasMoreTokens()) {
            return null
        }

        const string = this._string.slice(this._cursor)

        // template block start
        const matchedStart = /^{{t\s+([_a-zA-Z][_a-zA-Z0-9]*)}}/.exec(string)
        if (matchedStart !== null) {
            this._cursor += matchedStart[0].length
            return {type: 'TemplateStart', value: matchedStart[1]}
        }

        // template block stop
        const matchedStop = /^{{\/t}}/.exec(string)
        if (matchedStop !== null) {
            this._cursor += matchedStop[0].length
            return {type: 'TemplateStop', value: matchedStop[1]}
        }

        // expressions: {{ ... }}
        const matchedExpression = /^{{\s*([_a-zA-Z][_a-zA-Z0-9]*)\s*}}/.exec(string)
        if (matchedExpression !== null && !string.startsWith('{{t')) {
            this._cursor += matchedExpression[0].length
            return {type: 'Expression', value: matchedExpression[1].trim()}
        }

        // not an expression and not a template
        const matchedInvalidBlock = /^({{.*}})/.exec(string)
        if (matchedInvalidBlock !== null) {
            throw new SyntaxError(`Expected {{ expression }} or {{t TemplateName}} ... {{/t}} but got ` + matchedInvalidBlock[1])
        }

        // plain strings
        const matchedString = string.indexOf('{{')
        if (matchedString != -1) {
            const value = string.slice(0, matchedString)
            this._cursor += value.length
            return {type: 'String', value}
        }
        else {
            this._cursor += string.length
            return {type: 'String', value: string}
        }
    }
}


/**
 * Compiles the given string into a template.
 * 
 * @param {string} s The string to compile
 */
function compile(s) {
    const tokenizer = new Tokenizer(s)
    const template_stack = [new Template()]

    while (tokenizer.hasMoreTokens()) {
        let current_template = template_stack[template_stack.length - 1]
        const token = tokenizer.getNextToken()

        switch (token.type) {
            case 'String':
                current_template.add_string(token.value)
                break
            case 'Expression':
                current_template.add_expression(token.value)
                break
            case 'TemplateStart':
                const new_template = new Template(token.value)
                current_template.add_template(new_template)
                template_stack.push(new_template)
                break
            case 'TemplateStop':
                if (template_stack.length == 1) {
                    throw new SyntaxError('Found unexpected {{/t}}')
                }

                template_stack.pop()
                break
        }
    }

    if (template_stack.length != 1) {
        throw new SyntaxError('Missing one or more {{/t}}')
    }

    return template_stack[0]
}

module.exports = {
    Template,
    Tokenizer,
    compile
}