const config = {
    app: {
        elo: {
            K: 50
        }
    },
    aws: {
        secretAcessKey: process.env.secretAcessKey,
        accessKeyId: process.env.accessKeyId
    }
};

module.exports = config;