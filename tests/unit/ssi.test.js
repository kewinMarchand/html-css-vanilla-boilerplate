import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { renderSsi, SsiError } from '../../scripts/ssi.js'

const PARTIALS = {
  '/partials/nav.html':
    '<!--# if expr="$page = contact" -->[Contact actif]<!--# elif expr="$page = taches" -->[Tâches actif]<!--# else -->[aucun]<!--# endif -->',
}

const render = (html, variables) =>
  renderSsi(html, { readInclude: (path) => PARTIALS[path], variables })

describe('inclusions côté serveur', () => {
  it('inclut un fichier et lui transmet les variables posées par set', () => {
    assert.equal(
      render(
        '<!--# set var="page" value="contact" -->a<!--# include virtual="/partials/nav.html" -->b',
      ),
      'a[Contact actif]b',
    )
    assert.equal(
      render(
        '<!--# set var="page" value="taches" --><!--# include virtual="/partials/nav.html" -->',
      ),
      '[Tâches actif]',
    )
    assert.equal(render('<!--# include virtual="/partials/nav.html" -->'), '[aucun]')
  })

  it('gère la négation et les conditions imbriquées', () => {
    const html =
      '<!--# if expr="$a != x" -->1<!--# if expr="$b = y" -->2<!--# else -->3<!--# endif --><!--# else -->4<!--# endif -->'
    assert.equal(render(html, { a: 'z', b: 'y' }), '12')
    assert.equal(render(html, { a: 'z', b: 'n' }), '13')
    assert.equal(render(html, { a: 'x', b: 'y' }), '4')
  })

  it('ignore set dans une branche inactive', () => {
    assert.equal(
      render(
        '<!--# if expr="$a = b" --><!--# set var="c" value="d" --><!--# endif -->[<!--# if expr="$c = d" -->posé<!--# endif -->]',
      ),
      '[]',
    )
  })

  it('refuse les directives et les blocs hors du sous-ensemble pris en charge', () => {
    assert.throws(() => render('<!--# echo var="page" -->'), SsiError)
    assert.throws(() => render('<!--# if expr="$a = b" -->'), { message: '« if » sans « endif »' })
    assert.throws(() => render('<!--# endif -->'), { message: '« endif » sans « if »' })
    assert.throws(() => render('<!--# if expr="$a" --><!--# endif -->'), SsiError)
  })
})
