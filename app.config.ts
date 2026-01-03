export default {
  expo: {
      name: 'GeSIM',
      slug: 'gesim',
      scheme: 'phantomwallet',
      "extra": {
            "eas": {
              "projectId": "c391ca2f-7589-4a6b-88aa-83c58eb0c937"
            }
          },
    android: {
              package: "com.gesim.phantomwallet", // A standard convention is com.company.appname
         launchMode: 'singleTask',
      intentFilters: [
        {
          action: 'VIEW',
          data: [{ scheme: 'phantomwallet' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
  },
};
