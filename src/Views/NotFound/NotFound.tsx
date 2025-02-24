import React, { Fragment } from 'react';
import Head from '../../Components/Head';
import { Status } from '../../Components/Status';
import {
	ContentPusher,
	Container,
	Readable,
	Col,
} from '../../Components/Layout';
const styles = require('./NotFound.css');
import { H1 } from '../../Components/Heading';

function NotFound() {
	return (
		<Fragment>
			<Head title="React SSR Boilerplate • Not Found" />
			<Status code={404} />
			<ContentPusher>
				<Container>
					<Readable>
						<H1>Not Found</H1>
						<p>404 Error - Page not found.</p>
					</Readable>
				</Container>
			</ContentPusher>
		</Fragment>
	);
}

export default NotFound;
