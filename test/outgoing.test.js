'use strict';

var request = require('supertest-as-promised');

describe('Outgoing webook test', function(){

    var app = require('../app');

    it('gets a message from slack', function(){

        return request.agent(app)
            .post('/slack/outgoing')
            .send({
                token: 'cro2sMmX6nwFrykdpGFBGLBU',
                team_id: 'T0001',
                team_domain: 'example',
                channel_id: 'C2147483705',
                channel_name: 'test',
                timestamp: 1355517523.000005,
                user_id: 'U2147483697',
                user_name: 'Steve',
                text: 'vhsbot: Sample outgoing message',
                trigger_word: 'vhsbot:'
            })
            .expect(200);
    });

});
