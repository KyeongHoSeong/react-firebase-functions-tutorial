let db = {
    users: [
        {
            userId: 'QvX8wAMKzIUEBucLm8yVq89vi2C2', //uid
            email: 'user@email.com',
            handle: 'user',
            createdAt: "2020-09-07T23:17:12.788Z",
            imageUrl: '/image/dsaffdddfflld/dlddldldl',
            bio: 'hello....',
            website: '...',
            location: 'London, UK'
        }
    ],
    screams: [
        {
            userHandler: 'user', //users: handle
            body: 'this is the sc... body',
            createdAt: "2020-09-07T23:17:12.788Z",
            likeCounter: 5,
            commentCount: 2
        }
    ],
    comments: [
        {
            userHandle: 'user',
            screamId: 'hBtzxbJ9hdTL1HPPGuQ6',
            body: 'nice on',
            createdAt: "2020-09-07T23:17:12.788Z"

        }
    ]
};

const userDetails = {
    credentials: {
        userId: 'QvX8wAMKzIUEBucLm8yVq89vi2C2', //uid
        email: 'user@email.com',
        handle: 'user',
        createdAt: "2020-09-07T23:17:12.788Z",
        imageUrl: '/image/dsaffdddfflld/dlddldldl',
        bio: 'hello....',
        website: '...',
        location: 'London, UK'
    },
    likes: [
        {
            userHandle: 'user',
            screamId: 'hBtzxbJ9hdTL1HPPGuQ6'
        },
        {
            userHandle: 'user',
            screamId: 'hBtzxbJ9hdTL1HPPGuQ6'
        }
    ]

}