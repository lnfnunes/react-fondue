import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import createStore from './createStore';
import { Provider } from 'react-redux';
import { matchRoutes } from 'react-router-config';
import Routes, { routes } from '../App/Routes';
import { HelmetProvider } from 'react-helmet-async';
import { flushChunkNames } from 'react-universal-component/server';
import flushChunks from 'webpack-flush-chunks';
import extractLocalesFromReq from './client-locale/extractLocalesFromReq';
import guessLocale from './client-locale/guessLocale';
import { LOCALE_COOKIE_NAME, COOKIE_MAX_AGE } from './client-locale/constants';
import manifest from './manifest';
import robots from './robots';
import serialize from 'serialize-javascript';
const store = createStore();

export default ({ clientStats }) => (req, res) => {
	const promises = matchRoutes(routes, req.path).map(({ route }) => {
		route.loadData ? route.loadData(store) : null;
	});

	Promise.all(promises).then(() => {
		const userLocales = extractLocalesFromReq(req);
		let lang = guessLocale(['de', 'en'], userLocales, 'en');

		if (req.originalUrl.substr(1, 2) == 'de') {
			lang = 'de';
		}

		if (req.originalUrl.substr(1, 2) == 'en') {
			lang = 'en';
		}

		const context = {};
		const helmetContext = {};

		const app = renderToString(
			<HelmetProvider context={helmetContext}>
				<Provider store={store}>
					<StaticRouter location={req.originalUrl} context={context}>
						<Routes lang={lang} />
					</StaticRouter>
				</Provider>
			</HelmetProvider>,
		);

		const { helmet } = helmetContext;

		const { js, styles, cssHash } = flushChunks(clientStats, {
			chunkNames: flushChunkNames(),
		});

		const status = context.status || 200;

		if (context.status == 404) {
			console.log('Error 404: ', req.originalUrl);
		}

		if (context.url) {
			const redirectStatus = context.status || 302;
			res.redirect(redirectStatus, context.url);
			return;
		}

		if (req.url == '/manifest.json' || req.url == '/Manifest.json') {
			return res
				.header('Content-Type', 'application/manifest+json')
				.status(status)
				.send(manifest);
		}

		if (req.url == '/robots.txt' || req.url == '/Robots.txt') {
			return res
				.header('Content-Type', 'text/plain')
				.status(status)
				.send(robots);
		}

		res.status(status)
			.cookie(LOCALE_COOKIE_NAME, lang, {
				maxAge: COOKIE_MAX_AGE,
				httpOnly: false,
			})
			.header('Content-Type', 'text/html')
			.send(
				`<!DOCTYPE html><html lang="${lang}"><head><meta name="theme-color" content="#000000"/>${styles}${
					helmet.title
				}${helmet.meta.toString()}${helmet.link.toString()}</head><body><div id="react-root">${app}</div>${js}${cssHash}<script>window.REDUX_DATA = ${serialize(
					store.getState(),
				)}</script></body></html>`,
			);
	});
};
