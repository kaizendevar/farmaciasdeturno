const cheerio = require('cheerio'),
    puppeteer = require('puppeteer'),
    schedule = require("node-schedule"),
    http = require("http"),
    Telegraf = require("telegraf");

require('dotenv').config();

// Modificar .env.development por .env indicando los dos valores
const ACCESS_TOKEN_TELEGRAM = process.env.ACCESS_TOKEN_TELEGRAM;
const CHAT_ID = process.env.CHAT_ID;

const url = 'https://extranet.osam.org.ar/Consulta/embedFarmacias';

class Tracker {
    constructor(telegramBot) {
        this.telegramBot = telegramBot;
    }

    initialize = () => {
        this.getData();

        schedule.scheduleJob("0 */1 * * *", () => {
            this.getData();
        });
    };

    getDataFarmacias = () => new Promise ((res, rej) => {
        puppeteer
        .launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
        .then(browser => browser.newPage())
        .then(page => {
            return page.goto(url).then(function() {
                return page.content();
            });
        })
        .then(html => {
            const $ = cheerio.load(html);
            const farmacias = [];
            $('div[id="farmacias"] > a > div').each(function() {
                const nombre = $(this).find('h3').text().trim();
                const direccion = $(this).find('h4').first().text().trim().toUpperCase();
                const telefono = $(this).find('h4 ~ h4').text().trim();
            
                farmacias.push({
                    nombre: nombre,
                    direccion: direccion,
                    telefono: telefono,
                });
            });

            res(farmacias);
        })
        .catch((error) => { console.error(error); rej(error) });
})

    getDate() {
        var fecha = new Date(); // Fecha actual
        var mes = fecha.getMonth()+1; // obteniendo mes
        var dia = fecha.getDate(); // obteniendo dia
        var ano = fecha.getFullYear(); // obteniendo año
        if(dia<10)
            dia='0'+dia; // agrega cero si el menor de 10
        if(mes<10)
            mes='0'+mes // agrega cero si el menor de 10

        return dia+"/"+mes+"/"+ano;
    }

    BuilderString(farmacias, fecha) {
        let TelegramMessage = farmacias.reduce((acum,farmacia) => (
            acum + `${farmacia.nombre}\n\n${farmacia.direccion}\n${farmacia.telefono}\n\n ----- \n\n`
        ),`Farmacias de Turno HOY ${fecha}:\nHASTA LAS 23:59hs \n \n`);        

        return TelegramMessage;
    }

    sendNotification(message) {
        this.telegramBot.telegram.sendMessage(
            CHAT_ID,
            `${message}`
        );   
    }

    showPage(message) {
        http.createServer(function (req, res) {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(message);
        }).listen(80);
    }    

    async getData() { 
        const fecha = this.getDate();
        const farmacias = await this.getDataFarmacias();
        const textofarmacias = this.BuilderString(farmacias, fecha);
        this.sendNotification(textofarmacias);
        this.showPage(textofarmacias);
    }
}

const telegramBot = new Telegraf(ACCESS_TOKEN_TELEGRAM);

const tracker = new Tracker(telegramBot);
tracker.initialize();