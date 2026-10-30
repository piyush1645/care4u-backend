import ImageKit from "imagekit";

const imageKit = new ImageKit({
    privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
    publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
    urlEndpoint: process.env.IMAGE_KIT_ENDPOINT
});

export default imageKit