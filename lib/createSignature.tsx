
import crypto from 'crypto';

export default function createSignature() {
	const userAgent = navigator.userAgent;
	const language = navigator.language;
	const platform = navigator.platform;
	const product = navigator.product;
	const productSub = navigator.productSub;
	const vendor = navigator.vendor;
	const vendorSub = navigator.vendorSub;

	const key = `${userAgent}${language}${platform}${product}${productSub}${vendor}${vendorSub}`;

	// create a sha256 hmac with the secret key
	const hmac = crypto.createHmac('sha256', key);

	// return the hash
	return hmac.digest('hex');
}
