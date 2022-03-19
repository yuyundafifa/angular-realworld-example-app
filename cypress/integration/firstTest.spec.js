/// <reference types="cypress"/>

describe('Test with backend', () => {

    beforeEach('login to the app', () => {
        cy.intercept({method: 'Get', path: 'tags'}, {fixture:'tags.json'})
        cy.loginToApplication()
    })

    it('verify correct request and response', () => {

        cy.intercept('POST', '**/articles').as('postArticles')
        
        cy.contains('New Article').click()
        cy.get('[formcontrolname="title"]').type('The Articles')
        cy.get('[formcontrolname="description"]').type('Test Articles')
        cy.get('[formcontrolname="body"]').type('This is a body of Articles')
        cy.contains('Publish Article').click()

        cy.wait('@postArticles')
        cy.get('@postArticles').then( xhr => {
            console.log(xhr)
            expect(xhr.response.statusCode).to.equal(200)
            expect(xhr.request.body.article.body).to.equal('This is a body of Articles')
            expect(xhr.response.body.article.description).to.equal('Test Articles')
        })

    })

    it('intercepting and modifying the request and response', () => {
        // cy.intercept({method:'POST', url:'https://api.realworld.io/api/articles/'}
        //  ,(req)=>{
        //     req.body.article.description = "This is the description 2"
        //  }).as('postArticles')

        cy.intercept({method:'POST', url: Cypress.env('apiUrl')+'api/articles/'}
         ,(req)=>{
            req.reply( res => {
                expect(res.body.article.description).to.equal('This is the description')
                res.body.article.description = "This is the description 2"
            })
         }).as('postArticles')
        
        cy.contains('New Article').click()
        cy.get('[formcontrolname="title"]').type('Articles 15')
        cy.get('[formcontrolname="description"]').type('This is the description')
        cy.get('[formcontrolname="body"]').type('This is a body of Articles')
        cy.contains('Publish Article').click()

        cy.wait('@postArticles')
        cy.get('@postArticles').then( xhr => {
            console.log(xhr)
            expect(xhr.response.statusCode).to.equal(200)
            expect(xhr.request.body.article.body).to.equal('This is a body of Articles')
            expect(xhr.response.body.article.description).to.equal('This is the description 2')
        })

    })

    it('should gave tags with routing object', () => {
        cy.get('.tag-list')
        .should('contain', 'cypress')
        .and('contain', 'automation')
        .and('contain', 'testing')
    })

    it('verify global feed likes count', () => {
        
        cy.intercept('GET', '**/articles/feed*', {"articles": [],"articlesCount":0})
        cy.intercept('GET', '**/articles*', {fixture:'articles.json'})

        cy.contains('Global Feed').click()
        cy.get('app-article-list button').then( listOfbuttons => {
            expect(listOfbuttons[0]).to.contain('5')
            expect(listOfbuttons[1]).to.contain('10')
        })

        cy.fixture('articles').then( file => {
            const articleLink = file.articles[1].slug
            cy.intercept('POST', '**/articles/'+articleLink+'favorite', file)
        })
    
        cy.get('app-article-list button')
        .eq(1)
        .click()
        .should('contain', '11')
    })

    it('delete a new article in a global feed', () => {

        const uniqueTitle = Math.floor(Math.random() * 99999)
        const bodyRequest = {
            "article": {
                "tagList": [],
                "title": "Tested by API " + uniqueTitle,
                "description": "This is description",
                "body": "Just test"
            }
        }

        cy.get('@token').then(token => {

            cy.request({
                url: Cypress.env('apiUrl')+'api/articles/',
                headers: { 'Authorization': 'Token '+token},
                method: 'POST',
                body: bodyRequest
            }).then( response => {
                expect(response.status).to.equal(200)
            })

            cy.contains('Global Feed').click()
            cy.get('.article-preview').first().click()
            cy.get('.article-actions').contains('Delete Article').click()
        })
    }) 

})