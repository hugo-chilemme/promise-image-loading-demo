import getDeviceId from './getDeviceInfo';
import crypto from 'crypto';
import createSignature from './createSignature';


function encryptParams(params: any, sign: string): string {
	const algorithm = 'aes-256-cbc';
	const key = crypto.createHash('sha256').update(sign).digest();
	const iv = crypto.randomBytes(16);

	let cipher = crypto.createCipheriv(algorithm, key, iv);
	let encrypted = cipher.update(JSON.stringify(params));
	encrypted = Buffer.concat([encrypted, cipher.final()]);

	return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptParams(encryptedParams: string, sign: string): string {
	const algorithm = 'aes-256-cbc';
	const key = crypto.createHash('sha256').update(sign).digest();
	const textParts = encryptedParams.split(':');
	const ivPart = textParts.shift();
	if (!ivPart) {
		throw new Error('Invalid encrypted params');
	}
	const iv = Buffer.from(ivPart, 'hex');
	const encryptedText = Buffer.from(textParts.join(':'), 'hex');

	let decipher = crypto.createDecipheriv(algorithm, key, iv);
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);

	return decrypted.toString();
}


export default function ApiController(event: string, params: any, method = 'POST', options =  {}) {

	if (!params) {
		params = {};
	}

	const isDevMode = process.env.NODE_ENV === 'development';
	
	const data = new Promise(async (resolve, reject) => {
		

		params.deviceId = getDeviceId();


		const API_URL = 'https://www.zerod.fr/api/';
		
		let xhr = new XMLHttpRequest();

		const accessToken = localStorage.getItem("accessToken");
		const id = localStorage.getItem("id");

		let sign = createSignature();
		let Authorization;

		const encryptedParams = encryptParams(params, sign);

		params = {
			encryptedParams,
			deviceId: getDeviceId()
		};


		if (accessToken && id && event !== 'login') {

			Authorization = `Bearer ${accessToken}:${id}:${getDeviceId()}`;
			// Encrypt params
		}


		const query = Object.keys(params).map(key => key + '=' + params[key]).join('&');

		if (method !== "POST" && method !== "PUT") {
			xhr.open(method, API_URL + event + "?" + query, true);
		} else {
			xhr.open(method, API_URL + event, true);
		}
		
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.setRequestHeader('Signature', sign);

		if (accessToken && id && Authorization) {
			xhr.setRequestHeader("Authorization", Authorization);
		}


		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {

					let data = JSON.parse(decryptParams(xhr.responseText, sign));

					data.message = !data.message && data.error ? data.error : data.message;


					if (isDevMode) {
						console.log(`[DEBUG] ${event}`, data);
					}

					resolve(data);
				} else {
					console.error(event, xhr.responseText);

					if (isDevMode) {
						console.error(`[DEBUG] ${event}`, data);
					}

					resolve({
						status: 'error',
						message: 'Une erreur est survenue lors de la requête'
					});
				}
			}
		};

		xhr.send(JSON.stringify(params));

	});



	return data;


	
}