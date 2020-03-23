const cheerio = require('cheerio'),
    puppeteer = require('puppeteer'),
    schedule = require("node-schedule"),
    Telegraf = require("telegraf");

const ACCESS_TOKEN_TELEGRAM = "";
const CHAT_ID = "";

const url = 'https://extranet.osam.org.ar/Consulta/embedFarmacias';

class Tracker {
    constructor(telegramBot) {
        this.telegramBot = telegramBot;

        this.farmacias = {
            nombre: 0,
            direccion: 0,
            telefono: 0
        };
    }

    initialize = async () => {
        // const data = await this.setDataAndNotify(); ??
        // console.log('data', data);
        this.setDataAndNotify();

        schedule.scheduleJob("0 */1 * * *", () => {
            this.setDataAndNotify();
        });
    };

    getDataFarmacias = async farmacias => {
        try {
            puppeteer
            .launch()
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
                    const direccion = $(this).find('h4').first().text().trim();
                    const telefono = $(this).find('h4 ~ h4').text().trim();
                
                    farmacias.push({
                        nombre: nombre,
                        direccion: direccion,
                        telefono: telefono,
                    });
                });
            
                // var jsonObject = JSON.stringify(farmacias);
                // http.createServer(function (req, res) {
                //     res.writeHead(200, {'Content-Type': 'text/plain'});
                //     res.end(jsonObject);
                // }).listen(80);


                // Devuelve bien objeto JSON con todas las farmacias
                console.log('1 ', farmacias);
                return farmacias;
            })
            .catch(console.error);

        } catch (err) {
            throw new Error(`Error al obtener farmacias ${farmacias}`);
        }
    };

    setDataAndNotify = async () => {
        this.farmacias = await this.getDataFarmacias();

        // ERROR: No definido debido a que aún no terminó de obtener la información    
        console.log('Farmacias: ', this.farmacias);

        // val StringBuilder TelegramMessage = new StringBuilder
        // let TelegramMessage = new StringBuilder;
        // TelegramMessage.append(`Farmacias de Turno:`)
        // TelegramMessage.append(`${this.farmacias.nombre} + ' ' + ${this.farmacias.nombre} + ${this.farmacias.telefono}`)

        // this.telegramBot.telegram.sendMessage(
        //     CHAT_ID,
        //     `${TelegramMessage.toString}`
        // );        
    };
}

const telegramBot = new Telegraf(ACCESS_TOKEN_TELEGRAM);

const tracker = new Tracker(telegramBot);
tracker.initialize();