import 'dotenv/config';

import '../queues/meeting.worker.js'
import '../queues/appointment.worker.js'

console.log('BullMQ workers started');