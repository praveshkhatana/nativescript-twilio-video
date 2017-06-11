"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils = require("tns-core-modules/utils/utils");
var remoteVideo_1 = require("./remoteVideo");
var localVideo_1 = require("./localVideo");
var observable_1 = require("tns-core-modules/data/observable");
var app = require("application");
var AudioManager = android.media.AudioManager;
var LocalParticipant = com.twilio.video.LocalParticipant;
var RoomState = com.twilio.video.RoomState;
var Video = com.twilio.video.Video;
var VideoRenderer = com.twilio.video.VideoRenderer;
var TwilioException = com.twilio.video.TwilioException;
var AudioTrack = com.twilio.video.AudioTrack;
var CameraCapturer = com.twilio.video.CameraCapturer;
var ConnectOptions = com.twilio.video.ConnectOptions;
var LocalAudioTrack = com.twilio.video.LocalAudioTrack;
var LocalVideoTrack = com.twilio.video.LocalVideoTrack;
var Participant = com.twilio.video.Participant;
var Room = com.twilio.video.Room;
var VideoTrack = com.twilio.video.VideoTrack;
var VideoActivity = (function () {
    function VideoActivity() {
        var localVideo = new localVideo_1.LocalVideo();
        var remoteVideo = new remoteVideo_1.RemoteVideo();
        this.localVideoView = localVideo.get_local_view();
        this.remoteVideoView = remoteVideo.get_remote_view();
        this.audioManager = app.android.context.getSystemService(android.content.Context.AUDIO_SERVICE);
    }
    VideoActivity.prototype.createAudioAndVideoTracks = function () {
        if (this.localVideoTrack)
            return;
        this.localVideoView.setMirror(true);
        this.localAudioTrack = LocalAudioTrack.create(utils.ad.getApplicationContext(), true);
        this.cameraCapturer = new CameraCapturer(utils.ad.getApplicationContext(), CameraCapturer.CameraSource.FRONT_CAMERA);
        this.localVideoTrack = LocalVideoTrack.create(utils.ad.getApplicationContext(), true, this.cameraCapturer);
        this.localVideoTrack.addRenderer(this.localVideoView);
    };
    VideoActivity.prototype.toggle_local_video = function () {
        if (this.localVideoTrack) {
            var enable = !this.localVideoTrack.isEnabled();
            this.localVideoTrack.enable(enable);
        }
    };
    VideoActivity.prototype.toggle_local_audio = function () {
        if (this.localAudioTrack) {
            var enabled = !this.localAudioTrack.isEnabled();
            this.localAudioTrack(enabled);
        }
    };
    VideoActivity.prototype.destroy_local_video = function () {
        this.localVideoTrack.removeRenderer(this.localVideoView);
        this.localVideoTrack = null;
    };
    VideoActivity.prototype.destroy_local_audio = function () {
        this.localVideoTrack.removeRenderer(this.localVideoView);
        this.localVideoTrack = null;
    };
    VideoActivity.prototype.connect_to_room = function (roomName) {
        this.configureAudio(true);
        var connectOptionsBuilder = new ConnectOptions.Builder(this.accessToken).roomName(roomName);
        if (this.localAudioTrack !== null) {
            connectOptionsBuilder.audioTracks(java.util.Collections.singletonList(this.localAudioTrack));
        }
        if (this.localVideoTrack !== null) {
            connectOptionsBuilder.videoTracks(java.util.Collections.singletonList(this.localVideoTrack));
        }
        this.room = Video.connect(utils.ad.getApplicationContext(), connectOptionsBuilder.build(), this.roomListener());
    };
    VideoActivity.prototype.set_access_token = function (token, name) {
        this.accessToken = token;
        this.name = name;
    };
    VideoActivity.prototype.disconnect_from_room = function () {
        if (!this.localParticipant)
            return;
        this.localParticipant.removeVideoTrack(this.localVideoTrack);
        this.localParticipant = null;
        this.localVideoTrack.release();
        this.localVideoTrack = null;
    };
    VideoActivity.prototype.roomListener = function () {
        var self = this;
        var that = new WeakRef(this);
        self.videoEvent = new observable_1.Observable();
        return new Room.Listener({
            onConnected: function (room) {
                var owner = that.get();
                var list = room.getParticipants();
                console.log('owner below');
                console.dir(owner);
                console.log('this: ', this);
                self.localParticipant = room.getLocalParticipant();
                for (var i = 0, l = list.size(); i < l; i++) {
                    var participant = list.get(i);
                    self.addParticipant(participant);
                }
                console.log("onConnected: ", self.name);
                if (self.videoEvent) {
                    self.videoEvent.notify({
                        eventName: 'onConnected',
                        object: observable_1.fromObject({
                            room: room
                        })
                    });
                }
            },
            onConnectFailure: function (room, error) {
                console.log("failed to connect");
                console.log(error);
                self.configureAudio(false);
            },
            onDisconnected: function (room, error) {
                console.log("Disconnected from " + room.getName());
                self.room = null;
                self.configureAudio(false);
            },
            onParticipantConnected: function (room, participant) {
                console.log(self.name, ' participant added');
                self.addParticipant(participant);
            },
            onParticipantDisconnected: function (room, participant) {
                console.log('participant removed');
                self.removeParticipant(participant);
            },
            onRecordingStarted: function (room) {
                console.log('onRecordingStarted');
            },
            onRecordingStopped: function (room) {
                console.log('onRecordingStopped');
            }
        });
    };
    VideoActivity.prototype.participant_listener = function () {
        var self = this;
        return new Participant.Listener({
            onAudioTrackAdded: function (participant, audioTrack) {
                console.log('onAudioTrackAdded');
            },
            onAudioTrackRemoved: function (participant, audioTrack) {
                console.log('onAudioTrackRemoved');
            },
            onVideoTrackAdded: function (participant, videoTrack) {
                console.log(self.name, ' onVideoTrackAdded');
                self.addParticipantVideo(videoTrack);
            },
            onVideoTrackRemoved: function (participant, VideoTrack) {
                console.log('onVideoTrackRemoved');
            },
            onAudioTrackEnabled: function (participant, AudioTrack) {
            },
            onAudioTrackDisabled: function (participant, AudioTrack) {
            },
            onVideoTrackEnabled: function (participant, VideoTrack) {
                console.log('onVideoTrackEnabled');
            },
            onVideoTrackDisabled: function (participant, VideoTrack) {
            }
        });
    };
    VideoActivity.prototype.addParticipant = function (participant) {
        console.log('279: ');
        console.log(typeof participant);
        if (participant.getVideoTracks().size() > 0) {
            console.log(this.name, ' found video tracks');
            this.addParticipantVideo(participant.getVideoTracks().get(0));
        }
        participant.setListener(this.participant_listener());
    };
    VideoActivity.prototype.addParticipantVideo = function (videoTrack) {
        console.log(this.name, ' added video track: ', videoTrack);
        console.log(this.name, ' remote video view: ', this.remoteVideoView);
        this.localVideoView.setMirror(false);
        videoTrack.addRenderer(this.remoteVideoView);
    };
    VideoActivity.prototype.removeParticipant = function (participant) {
        console.log("Participant " + participant.getIdentity() + " left.");
        if (participant.getVideoTracks().size() > 0) {
            this.removeParticipantVideo(participant.getVideoTracks().get(0));
        }
        participant.setListener(null);
    };
    VideoActivity.prototype.removeParticipantVideo = function (videoTrack) {
        console.log('removeParticipantVideo was called');
        videoTrack.removeRenderer(this.remoteVideoView);
    };
    VideoActivity.prototype.configureAudio = function (enable) {
        if (enable) {
            this.previousAudioMode = this.audioManager.getMode();
            this.audioManager.requestAudioFocus(null, AudioManager.STREAM_VOICE_CALL, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
            this.audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            this.previousMicrophoneMute = this.audioManager.isMicrophoneMute();
            this.audioManager.setMicrophoneMute(false);
        }
        else {
            this.audioManager.setMode(this.previousAudioMode);
            this.audioManager.abandonAudioFocus(null);
            this.audioManager.setMicrophoneMute(this.previousMicrophoneMute);
        }
    };
    return VideoActivity;
}());
exports.VideoActivity = VideoActivity;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHdpbGlvLXZpZGVvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHdpbGlvLXZpZGVvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBSUEsb0RBQXNEO0FBQ3RELDZDQUE0QztBQUM1QywyQ0FBMEM7QUFDMUMsK0RBQTBFO0FBRTFFLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUlqQyxJQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztBQUNoRCxJQUFNLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDO0FBQzNELElBQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQztBQUM3QyxJQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDckMsSUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ3JELElBQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQztBQUN6RCxJQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUM7QUFDL0MsSUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDO0FBQ3ZELElBQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQztBQUN2RCxJQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUM7QUFDekQsSUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDO0FBQ3pELElBQU0sV0FBVyxHQUFHLEdBQUcsQ0FB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RU0sOENBQXNCLEdBQTdCLFVBQThCLFVBQVU7UUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO1FBQ2pELFVBQVUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFTSxzQ0FBYyxHQUFyQixVQUFzQixNQUFlO1FBRWpDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFFVCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUdyRCxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLHlCQUF5QixDQUFDLENBQUM7WUFTbEgsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFNOUQsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUNuRSxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRS9DLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUVyRSxDQUFDO0lBQ0wsQ0FBQztJQUVMLG9CQUFDO0FBQUQsQ0FBQyxBQXhVRCxJQXdVQztBQXhVWSxzQ0FBYSIsInNvdXJjZXNDb250ZW50IjpbIlxuXG5cbmltcG9ydCB7IFZpZXcgfSBmcm9tICd1aS9jb3JlL3ZpZXcnO1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvdXRpbHMvdXRpbHNcIjtcbmltcG9ydCB7IFJlbW90ZVZpZGVvIH0gZnJvbSBcIi4vcmVtb3RlVmlkZW9cIjtcbmltcG9ydCB7IExvY2FsVmlkZW8gfSBmcm9tIFwiLi9sb2NhbFZpZGVvXCI7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBmcm9tT2JqZWN0IH0gZnJvbSAndG5zLWNvcmUtbW9kdWxlcy9kYXRhL29ic2VydmFibGUnO1xuXG52YXIgYXBwID0gcmVxdWlyZShcImFwcGxpY2F0aW9uXCIpO1xuXG5kZWNsYXJlIHZhciBjb20sIGFuZHJvaWQ6IGFueTtcblxuY29uc3QgQXVkaW9NYW5hZ2VyID0gYW5kcm9pZC5tZWRpYS5BdWRpb01hbmFnZXI7XG5jb25zdCBMb2NhbFBhcnRpY2lwYW50ID0gY29tLnR3aWxpby52aWRlby5Mb2NhbFBhcnRpY2lwYW50O1xuY29uc3QgUm9vbVN0YXRlID0gY29tLnR3aWxpby52aWRlby5Sb29tU3RhdGU7XG5jb25zdCBWaWRlbyA9IGNvbS50d2lsaW8udmlkZW8uVmlkZW87XG5jb25zdCBWaWRlb1JlbmRlcmVyID0gY29tLnR3aWxpby52aWRlby5WaWRlb1JlbmRlcmVyO1xuY29uc3QgVHdpbGlvRXhjZXB0aW9uID0gY29tLnR3aWxpby52aWRlby5Ud2lsaW9FeGNlcHRpb247XG5jb25zdCBBdWRpb1RyYWNrID0gY29tLnR3aWxpby52aWRlby5BdWRpb1RyYWNrO1xuY29uc3QgQ2FtZXJhQ2FwdHVyZXIgPSBjb20udHdpbGlvLnZpZGVvLkNhbWVyYUNhcHR1cmVyO1xuY29uc3QgQ29ubmVjdE9wdGlvbnMgPSBjb20udHdpbGlvLnZpZGVvLkNvbm5lY3RPcHRpb25zO1xuY29uc3QgTG9jYWxBdWRpb1RyYWNrID0gY29tLnR3aWxpby52aWRlby5Mb2NhbEF1ZGlvVHJhY2s7XG5jb25zdCBMb2NhbFZpZGVvVHJhY2sgPSBjb20udHdpbGlvLnZpZGVvLkxvY2FsVmlkZW9UcmFjaztcbmNvbnN0IFBhcnRpY2lwYW50ID0gY29tLnR3aWxpby52aWRlby5QYXJ0aWNpcGFudDtcbmNvbnN0IFJvb20gPSBjb20udHdpbGlvLnZpZGVvLlJvb207XG5jb25zdCBWaWRlb1RyYWNrID0gY29tLnR3aWxpby52aWRlby5WaWRlb1RyYWNrO1xuXG4vLyBjb25zdCBWaWRlb1ZpZXc6IGFueSA9IGNvbS50d2lsaW8udmlkZW8uVmlkZW9WaWV3O1xuLy8gY29uc3QgdmlkZW9WaWV3ID0gbmV3IFZpZGVvVmlldyh1dGlscy5hZC5nZXRBcHBsaWNhdGlvbkNvbnRleHQoKSk7XG5cbi8vIGNvbnN0IHF1aWNrc3RhcnQuUiA9IGNvbS50d2lsaW8udmlkZW8ucXVpY2tzdGFydC5SO1xuLy8gY29uc3QgcXVpY2tzdGFydC5kaWFsb2cuRGlhbG9nID0gY29tLnR3aWxpby52aWRlby5xdWlja3N0YXJ0LmRpYWxvZy5EaWFsb2c7XG4vLyBjb25zdCBDYW1lcmFDYXB0dXJlci5DYW1lcmFTb3VyY2UgPSBjb20udHdpbGlvLnZpZGVvLkNhbWVyYUNhcHR1cmVyLkNhbWVyYVNvdXJjZTtcblxuZXhwb3J0IGNsYXNzIFZpZGVvQWN0aXZpdHkge1xuXG4gICAgcHVibGljIHByZXZpb3VzQXVkaW9Nb2RlOiBhbnk7XG4gICAgcHVibGljIGxvY2FsVmlkZW9WaWV3OiBhbnk7IFxuICAgIHB1YmxpYyByZW1vdGVWaWRlb1ZpZXc6IGFueTsgXG4gICAgcHVibGljIGxvY2FsVmlkZW9UcmFjazogYW55O1xuICAgIHB1YmxpYyBsb2NhbEF1ZGlvVHJhY2s6IGFueTtcbiAgICBwdWJsaWMgY2FtZXJhQ2FwdHVyZXI6IGFueTtcbiAgICBwdWJsaWMgYWNjZXNzVG9rZW46IHN0cmluZztcbiAgICBwdWJsaWMgVFdJTElPX0FDQ0VTU19UT0tFTjogc3RyaW5nO1xuICAgIHB1YmxpYyByb29tOiBzdHJpbmc7XG4gICAgcHVibGljIHBhcnRpY2lwYW50SWRlbnRpdHk6IHN0cmluZztcbiAgICBwdWJsaWMgcHJldmlvdXNNaWNyb3Bob25lTXV0ZTogYm9vbGVhbjtcbiAgICBwdWJsaWMgbG9jYWxQYXJ0aWNpcGFudDogYW55O1xuICAgIHB1YmxpYyBhdWRpb01hbmFnZXI6IGFueTtcbiAgICBwdWJsaWMgbmFtZTogc3RyaW5nO1xuICAgIHB1YmxpYyBuYW1lMjogc3RyaW5nO1xuICAgIHB1YmxpYyB2aWRlb0V2ZW50OiBPYnNlcnZhYmxlO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIC8vIHN1cGVyKCk7XG4gICAgICAgIGxldCBsb2NhbFZpZGVvID0gbmV3IExvY2FsVmlkZW8oKTtcbiAgICAgICAgbGV0IHJlbW90ZVZpZGVvID0gbmV3IFJlbW90ZVZpZGVvKCk7XG5cbiAgICAgICAgdGhpcy5sb2NhbFZpZGVvVmlldyA9IGxvY2FsVmlkZW8uZ2V0X2xvY2FsX3ZpZXcoKTtcbiAgICAgICAgdGhpcy5yZW1vdGVWaWRlb1ZpZXcgPSByZW1vdGVWaWRlby5nZXRfcmVtb3RlX3ZpZXcoKTtcbiAgICAgICAgdGhpcy5hdWRpb01hbmFnZXIgPSBhcHAuYW5kcm9pZC5jb250ZXh0LmdldFN5c3RlbVNlcnZpY2UoYW5kcm9pZC5jb250ZW50LkNvbnRleHQuQVVESU9fU0VSVklDRSk7XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZUF1ZGlvQW5kVmlkZW9UcmFja3MoKSB7XG5cbiAgICAgICAgaWYgKHRoaXMubG9jYWxWaWRlb1RyYWNrKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5sb2NhbFZpZGVvVmlldy5zZXRNaXJyb3IodHJ1ZSk7XG4gICAgICAgIHRoaXMubG9jYWxBdWRpb1RyYWNrID0gTG9jYWxBdWRpb1RyYWNrLmNyZWF0ZSh1dGlscy5hZC5nZXRBcHBsaWNhdGlvbkNvbnRleHQoKSwgdHJ1ZSk7XG4gICAgICAgIHRoaXMuY2FtZXJhQ2FwdHVyZXIgPSBuZXcgQ2FtZXJhQ2FwdHVyZXIodXRpbHMuYWQuZ2V0QXBwbGljYXRpb25Db250ZXh0KCksIENhbWVyYUNhcHR1cmVyLkNhbWVyYVNvdXJjZS5GUk9OVF9DQU1FUkEpO1xuICAgICAgICB0aGlzLmxvY2FsVmlkZW9UcmFjayA9IExvY2FsVmlkZW9UcmFjay5jcmVhdGUodXRpbHMuYWQuZ2V0QXBwbGljYXRpb25Db250ZXh0KCksIHRydWUsIHRoaXMuY2FtZXJhQ2FwdHVyZXIpO1xuICAgICAgICB0aGlzLmxvY2FsVmlkZW9UcmFjay5hZGRSZW5kZXJlcih0aGlzLmxvY2FsVmlkZW9WaWV3KTtcblxuXG5cbiAgICB9XG5cbiAgICBwdWJsaWMgdG9nZ2xlX2xvY2FsX3ZpZGVvKCkge1xuXG4gICAgICAgIGlmICh0aGlzLmxvY2FsVmlkZW9UcmFjaykge1xuXG4gICAgICAgICAgICBsZXQgZW5hYmxlID0gIXRoaXMubG9jYWxWaWRlb1RyYWNrLmlzRW5hYmxlZCgpO1xuXG4gICAgICAgICAgICB0aGlzLmxvY2FsVmlkZW9UcmFjay5lbmFibGUoZW5hYmxlKTtcblxuICAgICAgICB9XG5cbiAgICB9ICBcblxuICAgIHB1YmxpYyB0b2dnbGVfbG9jYWxfYXVkaW8oKSB7XG5cbiAgICAgICAgaWYgKHRoaXMubG9jYWxBdWRpb1RyYWNrKSB7XG5cbiAgICAgICAgICAgIGxldCBlbmFibGVkID0gIXRoaXMubG9jYWxBdWRpb1RyYWNrLmlzRW5hYmxlZCgpO1xuXG4gICAgICAgICAgICB0aGlzLmxvY2FsQXVkaW9UcmFjayhlbmFibGVkKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveV9sb2NhbF92aWRlbygpIHtcblxuICAgICAgICB0aGlzLmxvY2FsVmlkZW9UcmFjay5yZW1vdmVSZW5kZXJlcih0aGlzLmxvY2FsVmlkZW9WaWV3KTtcblxuICAgICAgICB0aGlzLmxvY2FsVmlkZW9UcmFjayA9IG51bGxcbiAgICAgICAgXG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveV9sb2NhbF9hdWRpbygpIHtcblxuICAgICAgICB0aGlzLmxvY2FsVmlkZW9UcmFjay5yZW1vdmVSZW5kZXJlcih0aGlzLmxvY2FsVmlkZW9WaWV3KTtcblxuICAgICAgICB0aGlzLmxvY2FsVmlkZW9UcmFjayA9IG51bGxcblxuICAgIH0gICAgICBcblxuICAgIHB1YmxpYyBjb25uZWN0X3RvX3Jvb20ocm9vbU5hbWU6IHN0cmluZykge1xuICAgICAgICBcbiAgICAgICAgdGhpcy5jb25maWd1cmVBdWRpbyh0cnVlKTtcblxuICAgICAgICBsZXQgY29ubmVjdE9wdGlvbnNCdWlsZGVyID0gbmV3IENvbm5lY3RPcHRpb25zLkJ1aWxkZXIodGhpcy5hY2Nlc3NUb2tlbikucm9vbU5hbWUocm9vbU5hbWUpO1xuXG4gICAgICAgIGlmICh0aGlzLmxvY2FsQXVkaW9UcmFjayAhPT0gbnVsbCkge1xuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICogQWRkIGxvY2FsIGF1ZGlvIHRyYWNrIHRvIGNvbm5lY3Qgb3B0aW9ucyB0byBzaGFyZSB3aXRoIHBhcnRpY2lwYW50cy5cbiAgICAgICAgICAgICovXG4gICAgICAgICAgICBjb25uZWN0T3B0aW9uc0J1aWxkZXIuYXVkaW9UcmFja3MoamF2YS51dGlsLkNvbGxlY3Rpb25zLnNpbmdsZXRvbkxpc3QodGhpcy5sb2NhbEF1ZGlvVHJhY2spKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLypcbiAgICAgICAgICogQWRkIGxvY2FsIHZpZGVvIHRyYWNrIHRvIGNvbm5lY3Qgb3B0aW9ucyB0byBzaGFyZSB3aXRoIHBhcnRpY2lwYW50cy5cbiAgICAgICAgICovXG5cbiAgICAgICAgaWYgKHRoaXMubG9jYWxWaWRlb1RyYWNrICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgIGNvbm5lY3RPcHRpb25zQnVpbGRlci52aWRlb1RyYWNrcyhqYXZhLnV0aWwuQ29sbGVjdGlvbnMuc2luZ2xldG9uTGlzdCh0aGlzLmxvY2FsVmlkZW9UcmFjaykpO1xuXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJvb20gPSBWaWRlby5jb25uZWN0KHV0aWxzLmFkLmdldEFwcGxpY2F0aW9uQ29udGV4dCgpLCBjb25uZWN0T3B0aW9uc0J1aWxkZXIuYnVpbGQoKSwgdGhpcy5yb29tTGlzdGVuZXIoKSk7XG5cblxuICAgIH1cblxuXG4gICAgcHVibGljIHNldF9hY2Nlc3NfdG9rZW4odG9rZW46IHN0cmluZywgbmFtZTogc3RyaW5nKSB7XG5cbiAgICAgICAgdGhpcy5hY2Nlc3NUb2tlbiA9IHRva2VuO1xuXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzY29ubmVjdF9mcm9tX3Jvb20oKSB7XG4gICAgICAgIC8vIGxvY2FsUGFydGljaXBhbnRcbiAgICAgICAgaWYgKCF0aGlzLmxvY2FsUGFydGljaXBhbnQpIHJldHVybjtcbiAgICAgICAgdGhpcy5sb2NhbFBhcnRpY2lwYW50LnJlbW92ZVZpZGVvVHJhY2sodGhpcy5sb2NhbFZpZGVvVHJhY2spO1xuICAgICAgICB0aGlzLmxvY2FsUGFydGljaXBhbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmxvY2FsVmlkZW9UcmFjay5yZWxlYXNlKCk7XG4gICAgICAgIHRoaXMubG9jYWxWaWRlb1RyYWNrID0gbnVsbDsgICAgICAgIFxuICAgIH1cblxuXG4gICAgcHVibGljIHJvb21MaXN0ZW5lcigpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgICAgICBsZXQgdGhhdCA9IG5ldyBXZWFrUmVmKHRoaXMpO1xuICAgICAgICBzZWxmLnZpZGVvRXZlbnQgPSBuZXcgT2JzZXJ2YWJsZSgpO1xuICAgICAgICByZXR1cm4gbmV3IFJvb20uTGlzdGVuZXIoe1xuICAgICAgICAgICAgb25Db25uZWN0ZWQocm9vbSkge1xuICAgICAgICAgICAgICAgIGxldCBvd25lciA9IHRoYXQuZ2V0KCk7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3QgPSByb29tLmdldFBhcnRpY2lwYW50cygpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvd25lciBiZWxvdycpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGlyKG93bmVyKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndGhpczogJywgdGhpcylcbiAgICAgICAgICAgICAgICBzZWxmLmxvY2FsUGFydGljaXBhbnQgPSByb29tLmdldExvY2FsUGFydGljaXBhbnQoKTtcbiAgICAgICAgICAgICAgICBcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGlzdC5zaXplKCk7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnRpY2lwYW50ID0gbGlzdC5nZXQoaSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYWRkUGFydGljaXBhbnQocGFydGljaXBhbnQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHNlbGYubmFtZSwgJyBjb25uZWN0ZWQgdG86ICcgKyByb29tLmdldE5hbWUoKSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJvbkNvbm5lY3RlZDogXCIsIHNlbGYubmFtZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2VsZi52aWRlb0V2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudmlkZW9FdmVudC5ub3RpZnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnROYW1lOiAnb25Db25uZWN0ZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBmcm9tT2JqZWN0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb29tOiByb29tXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1cblxuXG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkNvbm5lY3RGYWlsdXJlKHJvb20sIGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJmYWlsZWQgdG8gY29ubmVjdFwiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICAgICAgc2VsZi5jb25maWd1cmVBdWRpbyhmYWxzZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25EaXNjb25uZWN0ZWQocm9vbSwgZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRpc2Nvbm5lY3RlZCBmcm9tIFwiICsgcm9vbS5nZXROYW1lKCkpO1xuICAgICAgICAgICAgICAgIHNlbGYucm9vbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgLy8gT25seSByZWluaXRpYWxpemUgdGhlIFVJIGlmIGRpc2Nvbm5lY3Qgd2FzIG5vdCBjYWxsZWQgZnJvbSBvbkRlc3Ryb3koKVxuICAgICAgICAgICAgICAgIC8vIGlmICghZGlzY29ubmVjdGVkRnJvbU9uRGVzdHJveSkge1xuICAgICAgICAgICAgICAgIHNlbGYuY29uZmlndXJlQXVkaW8oZmFsc2UpO1xuICAgICAgICAgICAgICAgIC8vICAgICBpbnRpYWxpemVVSSgpO1xuICAgICAgICAgICAgICAgIC8vICAgICBtb3ZlTG9jYWxWaWRlb1RvUHJpbWFyeVZpZXcoKTtcbiAgICAgICAgICAgICAgICAvLyB9IFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uUGFydGljaXBhbnRDb25uZWN0ZWQocm9vbSwgcGFydGljaXBhbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzZWxmLm5hbWUsICcgcGFydGljaXBhbnQgYWRkZWQnKTtcbiAgICAgICAgICAgICAgICBzZWxmLmFkZFBhcnRpY2lwYW50KHBhcnRpY2lwYW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblBhcnRpY2lwYW50RGlzY29ubmVjdGVkKHJvb20sIHBhcnRpY2lwYW50KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3BhcnRpY2lwYW50IHJlbW92ZWQnKTtcbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZVBhcnRpY2lwYW50KHBhcnRpY2lwYW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblJlY29yZGluZ1N0YXJ0ZWQocm9vbSkge1xuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICogSW5kaWNhdGVzIHdoZW4gbWVkaWEgc2hhcmVkIHRvIGEgUm9vbSBpcyBiZWluZyByZWNvcmRlZC4gTm90ZSB0aGF0XG4gICAgICAgICAgICAgICAgICogcmVjb3JkaW5nIGlzIG9ubHkgYXZhaWxhYmxlIGluIG91ciBHcm91cCBSb29tcyBkZXZlbG9wZXIgcHJldmlldy5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb25SZWNvcmRpbmdTdGFydGVkJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25SZWNvcmRpbmdTdG9wcGVkKHJvb20pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb25SZWNvcmRpbmdTdG9wcGVkJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHBhcnRpY2lwYW50X2xpc3RlbmVyKCkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgICAgIHJldHVybiBuZXcgUGFydGljaXBhbnQuTGlzdGVuZXIoe1xuICAgICAgICAgICAgb25BdWRpb1RyYWNrQWRkZWQocGFydGljaXBhbnQsIGF1ZGlvVHJhY2spIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb25BdWRpb1RyYWNrQWRkZWQnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkF1ZGlvVHJhY2tSZW1vdmVkKHBhcnRpY2lwYW50LCBhdWRpb1RyYWNrKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ29uQXVkaW9UcmFja1JlbW92ZWQnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblZpZGVvVHJhY2tBZGRlZChwYXJ0aWNpcGFudCwgdmlkZW9UcmFjaykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNlbGYubmFtZSwgJyBvblZpZGVvVHJhY2tBZGRlZCcpXG4gICAgICAgICAgICAgICAgc2VsZi5hZGRQYXJ0aWNpcGFudFZpZGVvKHZpZGVvVHJhY2spO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uVmlkZW9UcmFja1JlbW92ZWQocGFydGljaXBhbnQsIFZpZGVvVHJhY2spIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb25WaWRlb1RyYWNrUmVtb3ZlZCcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uQXVkaW9UcmFja0VuYWJsZWQocGFydGljaXBhbnQsIEF1ZGlvVHJhY2spIHtcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uQXVkaW9UcmFja0Rpc2FibGVkKHBhcnRpY2lwYW50LCBBdWRpb1RyYWNrKSB7XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblZpZGVvVHJhY2tFbmFibGVkKHBhcnRpY2lwYW50LCBWaWRlb1RyYWNrKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ29uVmlkZW9UcmFja0VuYWJsZWQnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblZpZGVvVHJhY2tEaXNhYmxlZChwYXJ0aWNpcGFudCwgVmlkZW9UcmFjaykge1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGFkZFBhcnRpY2lwYW50KHBhcnRpY2lwYW50KSB7XG4gICAgICAgIC8vIGlmICh0eXBlb2YgcGFydGljaXBhbnQgPT09ICdzdHJpbmcnKSByZXR1cm47XG4gICAgICAgIC8vIHRoaXMucGFydGljaXBhbnRJZGVudGl0eSA9IHBhcnRpY2lwYW50LmdldElkZW50aXR5KCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCd0aGlzLnBhcnRpY2lwYW50SWRlbnRpdHkgOicsIHRoaXMucGFydGljaXBhbnRJZGVudGl0eSApO1xuXG4gICAgICAgIC8qXG4gICAgICAgICogQWRkIHBhcnRpY2lwYW50IHJlbmRlcmVyXG4gICAgICAgICovXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdwYXJ0aWNpcGFudDogJywgcGFydGljaXBhbnQpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygncGFydGljaXBhbnQuZ2V0VmlkZW9UcmFja3M6ICcsIHBhcnRpY2lwYW50LmdldFZpZGVvVHJhY2tzKCkpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygncGFydGljaXBhbnQuZ2V0VmlkZW9UcmFja3MoKS5zaXplKCk6ICcsIHBhcnRpY2lwYW50LmdldFZpZGVvVHJhY2tzKCkuc2l6ZSgpKVxuICAgICAgICBjb25zb2xlLmxvZygnMjc5OiAnKTtcbiAgICAgICAgY29uc29sZS5sb2codHlwZW9mIHBhcnRpY2lwYW50KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coT2JqZWN0LmtleXMocGFydGljaXBhbnQpKTtcbiAgICAgICAgXG5cbiAgICAgICAgaWYgKHBhcnRpY2lwYW50LmdldFZpZGVvVHJhY2tzKCkuc2l6ZSgpID4gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5uYW1lLCAnIGZvdW5kIHZpZGVvIHRyYWNrcycpO1xuICAgICAgICAgICAgdGhpcy5hZGRQYXJ0aWNpcGFudFZpZGVvKHBhcnRpY2lwYW50LmdldFZpZGVvVHJhY2tzKCkuZ2V0KDApKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICogU3RhcnQgbGlzdGVuaW5nIGZvciBwYXJ0aWNpcGFudCBldmVudHNcbiAgICAgICAgICovXG4gICAgICAgIHBhcnRpY2lwYW50LnNldExpc3RlbmVyKHRoaXMucGFydGljaXBhbnRfbGlzdGVuZXIoKSk7XG5cbiAgICB9XG5cbiAgICAvKlxuICAgICAqIFNldCBwcmltYXJ5IHZpZXcgYXMgcmVuZGVyZXIgZm9yIHBhcnRpY2lwYW50IHZpZGVvIHRyYWNrXG4gICAgICovXG4gICAgcHJpdmF0ZSBhZGRQYXJ0aWNpcGFudFZpZGVvKHZpZGVvVHJhY2spIHtcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5uYW1lLCAnIGFkZGVkIHZpZGVvIHRyYWNrOiAnLCB2aWRlb1RyYWNrKTtcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5uYW1lLCAnIHJlbW90ZSB2aWRlbyB2aWV3OiAnLCB0aGlzLnJlbW90ZVZpZGVvVmlldyk7XG4gICAgICAgIHRoaXMubG9jYWxWaWRlb1ZpZXcuc2V0TWlycm9yKGZhbHNlKTtcbiAgICAgICAgdmlkZW9UcmFjay5hZGRSZW5kZXJlcih0aGlzLnJlbW90ZVZpZGVvVmlldyk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZVBhcnRpY2lwYW50KHBhcnRpY2lwYW50KSB7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJQYXJ0aWNpcGFudCBcIiArIHBhcnRpY2lwYW50LmdldElkZW50aXR5KCkgKyBcIiBsZWZ0LlwiKTtcbiAgICAgICAgLypcbiAgICAgICAgICogUmVtb3ZlIHBhcnRpY2lwYW50IHJlbmRlcmVyXG4gICAgICAgICAqL1xuICAgICAgICBpZiAocGFydGljaXBhbnQuZ2V0VmlkZW9UcmFja3MoKS5zaXplKCkgPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZVBhcnRpY2lwYW50VmlkZW8ocGFydGljaXBhbnQuZ2V0VmlkZW9UcmFja3MoKS5nZXQoMCkpO1xuICAgICAgICB9XG4gICAgICAgIHBhcnRpY2lwYW50LnNldExpc3RlbmVyKG51bGwpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZVBhcnRpY2lwYW50VmlkZW8odmlkZW9UcmFjaykgeyBcbiAgICAgICAgY29uc29sZS5sb2coJ3JlbW92ZVBhcnRpY2lwYW50VmlkZW8gd2FzIGNhbGxlZCcpO1xuICAgICAgICB2aWRlb1RyYWNrLnJlbW92ZVJlbmRlcmVyKHRoaXMucmVtb3RlVmlkZW9WaWV3KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY29uZmlndXJlQXVkaW8oZW5hYmxlOiBib29sZWFuKSB7XG5cbiAgICAgICAgaWYgKGVuYWJsZSkge1xuXG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzQXVkaW9Nb2RlID0gdGhpcy5hdWRpb01hbmFnZXIuZ2V0TW9kZSgpO1xuXG4gICAgICAgICAgICAvLyBSZXF1ZXN0IGF1ZGlvIGZvY3VzIGJlZm9yZSBtYWtpbmcgYW55IGRldmljZSBzd2l0Y2guXG4gICAgICAgICAgICB0aGlzLmF1ZGlvTWFuYWdlci5yZXF1ZXN0QXVkaW9Gb2N1cyhudWxsLCBBdWRpb01hbmFnZXIuU1RSRUFNX1ZPSUNFX0NBTEwsIEF1ZGlvTWFuYWdlci5BVURJT0ZPQ1VTX0dBSU5fVFJBTlNJRU5UKTtcblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAqIFVzZSBNT0RFX0lOX0NPTU1VTklDQVRJT04gYXMgdGhlIGRlZmF1bHQgYXVkaW8gbW9kZS4gSXQgaXMgcmVxdWlyZWRcbiAgICAgICAgICAgICAqIHRvIGJlIGluIHRoaXMgbW9kZSB3aGVuIHBsYXlvdXQgYW5kL29yIHJlY29yZGluZyBzdGFydHMgZm9yIHRoZSBiZXN0XG4gICAgICAgICAgICAgKiBwb3NzaWJsZSBWb0lQIHBlcmZvcm1hbmNlLiBTb21lIGRldmljZXMgaGF2ZSBkaWZmaWN1bHRpZXMgd2l0aFxuICAgICAgICAgICAgICogc3BlYWtlciBtb2RlIGlmIHRoaXMgaXMgbm90IHNldC5cbiAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICB0aGlzLmF1ZGlvTWFuYWdlci5zZXRNb2RlKEF1ZGlvTWFuYWdlci5NT0RFX0lOX0NPTU1VTklDQVRJT04pO1xuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICogQWx3YXlzIGRpc2FibGUgbWljcm9waG9uZSBtdXRlIGR1cmluZyBhIFdlYlJUQyBjYWxsLlxuICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNNaWNyb3Bob25lTXV0ZSA9IHRoaXMuYXVkaW9NYW5hZ2VyLmlzTWljcm9waG9uZU11dGUoKTtcbiAgICAgICAgICAgIHRoaXMuYXVkaW9NYW5hZ2VyLnNldE1pY3JvcGhvbmVNdXRlKGZhbHNlKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICB0aGlzLmF1ZGlvTWFuYWdlci5zZXRNb2RlKHRoaXMucHJldmlvdXNBdWRpb01vZGUpO1xuICAgICAgICAgICAgdGhpcy5hdWRpb01hbmFnZXIuYWJhbmRvbkF1ZGlvRm9jdXMobnVsbCk7XG4gICAgICAgICAgICB0aGlzLmF1ZGlvTWFuYWdlci5zZXRNaWNyb3Bob25lTXV0ZSh0aGlzLnByZXZpb3VzTWljcm9waG9uZU11dGUpO1xuXG4gICAgICAgIH1cbiAgICB9XG5cbn0iXX0=