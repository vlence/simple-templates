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
        this.name = name

        /**
         * @type {{type: string; value: string|Template;}[]}
         */
        this._tokens = []

        /**
         * @type {{[name: string]: Template;}}
         */
        this._templates_map = {}

        /**
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
        this._tokens.push({type: 'Template', value: t})
        this._templates_map[t.name] = t
        this._templates_list.push(t)
    }

    /**
     * Render this template. You can optionally provide a context.
     * 
     * If you pass in a string as the first argument 
     * 
     * `undefined` and `null` are not rendered.
     * 
     * @param {string|any} name Name of an inner template
     * @param {any} context The context for this render
     * 
     * @throws Will throw if an inner template with the given name can't be found.
     * 
     * @returns {string} The rendered template.
     */
    render(name, context = {}) {
        const nameIsUndefinedOrNull = name === undefined || name === null
        const nameIsNotString = typeof name !== 'string'
        const contextIsUndefinedOrNull = context === undefined || context === null

        if (contextIsUndefinedOrNull) {
            context = {}
        }
        
        if (nameIsUndefinedOrNull) {
            return this._render(context)
        }
        else if (nameIsNotString) {
            return this._render(name)
        }
        else {
            return this._render_template(name, context)
        }
    }

    /**
     * Render the template with the given name.
     * 
     * @param {string} name The name of the template
     * @param {any} context The rendering context
     * @returns {string}
     */
    _render_template(name, context) {
        const template = this._find(name)

        if (template) {
            return template.render(context)
        }

        throw new Error('Cannot find inner template with name ' + name)
    }

    /**
     * Render this template with the given context.
     * 
     * @param {any} context The rendering context
     * @returns {string}
     */
    _render(context) {
        let output = ''
        
        for (let i = 0; i < this._tokens.length; i++) {
            const token = this._tokens[i]

            switch (token.type) {
                case 'String':
                    output += token.value
                    break
                case 'Template':
                    output += token.value.render(context)
                    break
                case 'Expression':
                    const expr = context[token.value]
                    
                    // don't render undefined and null
                    if (expr !== undefined && expr !== null) {
                        output += expr
                    }

                    break
            }
        }

        return output
    }

    /**
     * Finds the template with the given name.
     * 
     * @param {string} name Name of the template
     * @returns {Template|undefined}
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
        const matchedStart = /^{{template\s+([_a-zA-Z][_a-zA-Z0-9]*)}}/.exec(string)
        if (matchedStart !== null) {
            this._cursor += matchedStart[0].length
            return {type: 'TemplateStart', value: matchedStart[1]}
        }

        // template block stop
        const matchedStop = /^{{\/template}}/.exec(string)
        if (matchedStop !== null) {
            this._cursor += matchedStop[0].length
            return {type: 'TemplateStop', value: matchedStop[1]}
        }

        // expressions: {{ ... }}
        const matchedExpression = /^{{\s*([_a-zA-Z][_a-zA-Z0-9]*)\s*}}/.exec(string)
        if (matchedExpression !== null && !string.startsWith('{{template')) {
            this._cursor += matchedExpression[0].length
            return {type: 'Expression', value: matchedExpression[1].trim()}
        }

        // not an expression and not a template
        const matchedInvalidBlock = /^({{.*}})/.exec(string)
        if (matchedInvalidBlock !== null) {
            throw new SyntaxError(`Expected {{ expression }} or {{template TemplateName}} ... {{/template}} but got ` + matchedInvalidBlock[1])
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
                    throw new SyntaxError('Found unexpected {{/template}}')
                }

                template_stack.pop()
                break
        }
    }

    if (template_stack.length != 1) {
        throw new SyntaxError('Missing one or more {{/template}}')
    }

    return template_stack[0]
}

module.exports = {
    Template,
    Tokenizer,
    compile
}