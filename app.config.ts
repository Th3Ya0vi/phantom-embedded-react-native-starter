export default {
  expo: {
    name: 'GeSIM',
    slug: 'gesim',
    scheme: 'gesim',
    "extra": {
      "eas": {
        "projectId": "c391ca2f-7589-4a6b-88aa-83c58eb0c937"
      },
      "privyAppId": "cmjzlg3ve02kfky0ccf2wlfgf",
      "privyClientId": "client-WY6UJTY593q4qae9qtadtjEavq3XG31DewG9dn2mJWfnK",
      "passkeyAssociatedDomain": "https://gesimbackend.onrender.com"
    },
    android: {
      package: "com.gesim.wallet", // A standard convention is com.company.appname
      launchMode: 'singleTask',
      intentFilters: [
        {
          action: 'VIEW',
          data: [{ scheme: 'gesim' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
  },
};
