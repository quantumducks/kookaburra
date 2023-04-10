# Contributing

> Please note that this project is released with a [Contributor Code of Conduct](./CONDUCT.md).
> By participating in this project you agree to abide by its terms.

## What You'll Need

1. [Node LTS](https://nodejs.org/)
2. [Docker Desktop](https://www.docker.com/get-started)
3. [Kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installing-with-a-package-manager)
4. [Helm](https://helm.sh/docs/intro/install/#from-homebrew-macos)
5. [Telepresence](https://www.telepresence.io/docs/latest/install/)
6. Approved [Bug or Feature](https://github.com/toa-io/toa/issues)

## Setup

```shell
$ npm run env
$ npm i
```

```shell
$ export TOA_ENV=toa_local
```

## Branching Model

Please
follow [Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow). Name
feature branches as `feat/feature-name`.

### Versioning

Feature branches **must not** change versions. Version is updated when PR is merged to the `dev`
branch.

## Code Structure

These requirements may have reasonable exceptions. The point is to create as uniform code as
possible and prevent some
typical mistakes.

<!--suppress ALL -->
<table>
  <tr>
    <td valign=top>Strict mode</td>
    <td>
All modules must be in <a href=https://developer.mozilla.org/en-US/docs/Web/>strict mode</a>
    </td>
  </tr>
  <tr>
    <td valign=top>Single quotes</td>
    <td>

`'like this'` not `"like that"`

`` `this is also ok if ${necessary}`  ``
   </td>
  </tr>
  <tr>
    <td valign=top>

`exports` last
</td>
<td>Put all exports at the end of a module.</td>
  </tr>
  <tr>
    <td valign=top>No default exports</td>
    <td>Use only named export.</td>
  </tr>
  <tr>
    <td valign=top>No 'module.exports'</td>
    <td>Use `exports.name` instead of `module.exports.name`</td>
  </tr>
  <tr>
    <td valign=top>One class per file</td>
    <td>Put a class into a module with the same name in lowercase.</td>
  </tr>
  <tr>
    <td valign=top>Namespace directories</td>
    <td>
        Use directories as namespaces. Put <code>index.js</code> file into these directories to export public classes.
    </td>
  </tr>
  <tr>
    <td valign=top>Helper directories</td>
    <td>
        Put 'subclasses' or helper functions into a folder with the same name as your main module prefixed with the dot.
    </td>
  </tr>
  <tr>
    <td valign=top>Type definitions</td>
    <td>
        Define types with <a href="https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html">.d.ts</a> in <code>types</code> directory on the same level as <code>src</code>. <code>src</code> and <code>types</code> should have same structure.
        <br/>
        Export types within appropriate namespaces (ex: <code>toa.runtime.core</code>).
        <br/>
        Use <a href="https://jsdoc.app">JSDoc comments</a> for all public stuff.
    </td>
  </tr>
</table>

### Module Structure

```javascript
'use strict'

// external dependencies
const lib1 = require('node-libs')
const lib2 = require('third-party-libs')
const { tool } = require('@toa.io/libs')

// local dependencies
const { local } = require('./local/module')

// what your module exports should be at first (public first - private last)
class Declaration {
  // public first
  pub

  // private last
  #priv

  constructor (arg) {}

  // public first
  method () {}

  // private last
  #method () {}

  // static properties and methods should be last event if they're public
  static method () {}
}

// private last
const CONSTANT = 'value'

const utility = () => {}

// exports last
exports.Declaration = Declaration
```
