"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var observable_1 = require("tns-core-modules/data/observable");
var delegates_1 = require("./delegates");
var VideoActivity = (function() {
  function VideoActivity() {
    this._roomDelegate = delegates_1.RoomDelegate.initWithOwner(
      new WeakRef(this),
      this
    );
    this._participantDelegate = delegates_1.RemoteParticipantDelegate.initWithOwner(
      new WeakRef(this),
      this
    );
  }
  VideoActivity.prototype.startPreview = function() {
    this.camera = TVICameraCapturer.alloc().initWithSource(
      TVICameraCaptureSourceFrontCamera
    );
    this.localVideoTrack = TVILocalVideoTrack.trackWithCapturer(this.camera);
    if (!this.localVideoTrack) {
      this.notify("Failed to add video track");
    } else {
      this.localVideoTrack.addRenderer(this.localVideoView);
    }
  };
  VideoActivity.prototype.flipCamera = function() {
    if (this.camera.source != TVICameraCaptureSourceFrontCamera) {
      this.camera.selectSource(TVICameraCaptureSourceFrontCamera);
      this.localVideoView.mirror = true;
    } else {
      this.camera.selectSource(TVICameraCaptureSourceBackCameraWide);
      this.localVideoView.mirror = false;
    }
  };
  VideoActivity.prototype.disconnect = function() {
    if (this.room) {
      this.room.disconnect();
    }
  };
  VideoActivity.prototype.toggle_local_video = function() {
    if (this.localVideoTrack) {
      this.localVideoTrack.enabled = !this.localVideoTrack.enable;
    }
  };
  VideoActivity.prototype.toggle_local_audio = function() {
    if (this.localAudioTrack) {
      this.localAudioTrack.enabled = !this.localAudioTrack.enabled;
    }
  };
  VideoActivity.prototype.connect_to_room = function(room, options) {
    var _this = this;
    if (!this.accessToken) {
      this.notify("Please provide a valid token to connect to a room");
      return;
    }
    if (!this.localAudioTrack && options.audio) {
      this.localAudioTrack = TVILocalAudioTrack.track();
    }
    if (!this.localVideoTrack && options.video) {
      this.startPreview();
    }
    var connectOptions = TVIConnectOptions.optionsWithTokenBlock(
      this.accessToken,
      function(builder) {
        if (options.audio) builder.audioTracks = [_this.localAudioTrack];
        if (options.video) builder.videoTracks = [_this.localVideoTrack];
        builder.roomName = room;
      }
    );
    this.room = TwilioVideo.connectWithOptionsDelegate(
      connectOptions,
      this._roomDelegate
    );
  };
  VideoActivity.prototype.cleanupRemoteParticipant = function() {
    if (this.remoteParticipant) {
      if (this.remoteParticipant.videoTracks.count > 0) {
        var videoTrack = this.remoteParticipant.remoteVideoTracks[0]
          .remoteTrack;
        try {
          videoTrack.removeRenderer(this.remoteVideoView);
        } catch (e) {
          console.log(e);
          this.notify(e);
        }
      }
    }
  };
  VideoActivity.prototype.notify = function(reason) {
    this.event.notify({
      eventName: "error",
      object: observable_1.fromObject({
        reason: reason
      })
    });
  };
  VideoActivity.prototype.connectToRoomWithListener = function(room) {
    if (room.remoteParticipants.count > 0) {
      this.remoteParticipant = room.remoteParticipants[0];
      this.remoteParticipant.delegate = this._participantDelegate;
    }
  };
  VideoActivity.prototype.participant_joined_room = function(participant) {
    if (!this.remoteParticipant) {
      this.remoteParticipant = participant;
      this.remoteParticipant.delegate = this._participantDelegate;
    }
  };
  VideoActivity.prototype.set_access_token = function(token) {
    this.accessToken = token;
  };
  VideoActivity.prototype.remove_remote_view = function(
    videoTrack,
    participant
  ) {
    if (this.remoteParticipant == participant) {
      console.log("remove_remote_view");
      videoTrack.removeRenderer(this.remoteVideoView);
    }
  };
  VideoActivity.prototype.add_video_track = function(videoTrack) {
    videoTrack.addRenderer(this.remoteVideoView);
  };
  VideoActivity.prototype.destroy_local_video = function() {
    this.localVideoTrack.removeRenderer(this.localVideoView);
  };
  VideoActivity.prototype.configure_audio = function(enable) {
    if (!this.localAudioTrack) {
      this.localAudioTrack = TVILocalAudioTrack.track();
      if (!this.localAudioTrack) {
        return "failed to get local audio";
      }
    }
  };
  Object.defineProperty(VideoActivity.prototype, "event", {
    get: function() {
      return delegates_1.DelegateEvents._event;
    },
    enumerable: true,
    configurable: true
  });
  return VideoActivity;
})();
exports.VideoActivity = VideoActivity;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHdpbGlvLXZpZGVvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHdpbGlvLXZpZGVvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0EsK0RBQTBFO0FBRTFFLHlDQUE4RztBQWM5RztJQXNCSTtRQU1JLElBQUksQ0FBQyxhQUFhLEdBQUcsd0JBQVksQ0FBQyxhQUFhLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFekUsSUFBSSxDQUFDLG9CQUFvQixHQUFHLHFDQUF5QixDQUFDLGFBQWEsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUVqRyxDQUFDO0lBc0JELG9DQUFZLEdBQVo7UUFHSSxJQUFJLENBQUMsTUFBTSxHQUFHLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDLGNBQWMsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1FBRTFGLElBQUksQ0FBQyxlQUFlLEdBQUcsa0JBQWtCLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXpFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFFeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBRTdDLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUUxRCxDQUFDO0lBRUwsQ0FBQztJQUVELGtDQUFVLEdBQVY7UUFDSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNaLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDM0IsQ0FBQztJQUNMLENBQUM7SUFFTSwwQ0FBa0IsR0FBekI7UUFFSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMs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QUFlLEdBQXRCLFVBQXVCLE1BQWU7UUFLbEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztZQUV4QixJQUFJLENBQUMsZUFBZSxHQUFHLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBRWxELEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7Z0JBRXhCLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQztZQUV2QyxDQUFDO1FBRUwsQ0FBQztJQUVMLENBQUM7SUFJRCxzQkFBSSxnQ0FBSzthQUFUO1lBRUksTUFBTSxDQUFDLDBCQUFjLENBQUMsTUFBTSxDQUFDO1FBRWpDLENBQUM7OztPQUFBO0lBS0wsb0JBQUM7QUFBRCxDQUFDLEFBelFELElBeVFDO0FBelFZLHNDQUFhIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgeyBSZW1vdGVWaWRlbyB9IGZyb20gXCIuL3JlbW90ZVZpZGVvXCI7XG5pbXBvcnQgeyBMb2NhbFZpZGVvIH0gZnJvbSBcIi4vbG9jYWxWaWRlb1wiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgZnJvbU9iamVjdCB9IGZyb20gJ3Rucy1jb3JlLW1vZHVsZXMvZGF0YS9vYnNlcnZhYmxlJztcbmltcG9ydCB7IFZpZGVvQWN0aXZpdHlCYXNlIH0gZnJvbSBcIi4uL3R3aWxpby1jb21tb25cIjtcbmltcG9ydCB7IFJvb21EZWxlZ2F0ZSwgUmVtb3RlUGFydGljaXBhbnREZWxlZ2F0ZSwgRGVsZWdhdGVFdmVudHMsIENhbWVyYUNhcHR1cmVyRGVsZWdhdGUgfSBmcm9tIFwiLi9kZWxlZ2F0ZXNcIjtcbmltcG9ydCAqIGFzIGFwcGxpY2F0aW9uIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2FwcGxpY2F0aW9uXCI7XG5cbmRlY2xhcmUgdmFyIFRWSUNvbm5lY3RPcHRpb25zLFxuICAgIFRWSUNhbWVyYUNhcHR1cmVyLFxuICAgIFRWSUxvY2FsVmlkZW9UcmFjayxcbiAgICBUVklSZW1vdGVQYXJ0aWNpcGFudCxcbiAgICBUd2lsaW9WaWRlbyxcbiAgICBUVklMb2NhbEF1ZGlvVHJhY2ssXG4gICAgVFZJUm9vbSxcbiAgICBUVklWaWRlb1ZpZXcsXG4gICAgVFZJQ2FtZXJhQ2FwdHVyZVNvdXJjZUZyb250Q2FtZXJhO1xuXG5cbmV4cG9ydCBjbGFzcyBWaWRlb0FjdGl2aXR5IHtcblxuICAgIGxvY2FsVmlkZW9WaWV3OiBhbnk7XG4gICAgcmVtb3RlVmlkZW9WaWV3OiBhbnk7XG4gICAgbG9jYWxWaWRlb1RyYWNrOiBhbnk7XG4gICAgbG9jYWxBdWRpb1RyYWNrOiBhbnk7XG4gICAgY2FtZXJhQ2FwdHVyZXI6IGFueTtcbiAgICBfY2FtZXJhQ2FwdHVyZXJEZWxlZ2F0ZTogYW55O1xuICAgIGFjY2Vzc1Rva2VuOiBzdHJpbmc7XG4gICAgcm9vbU9iajogYW55O1xuICAgIHByZXZpb3VzTWljcm9waG9uZU11dGU6IGJvb2xlYW47XG4gICAgbG9jYWxQYXJ0aWNpcGFudDogYW55O1xuICAgIHJlbW90ZVBhcnRpY2lwYW50OiBhbnk7XG4gICAgX3Jvb21MaXN0ZW5lcjogYW55O1xuICAgIF9wYXJ0aWNpcGFudERlbGVnYXRlOiBhbnk7XG4gICAgX3Jvb21EZWxlZ2F0ZTogYW55O1xuICAgIHBhcnRpY2lwYW50OiBhbnk7XG4gICAgLy8gZXZlbnQ6IE9ic2VydmFibGU7XG4gICAgcm9vbTogYW55O1xuICAgIGNhbWVyYTogYW55O1xuICAgIHRlc3Q6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIC8vIHRoaXMuZXZlbnQgPSBuZXcgT2JzZXJ2YWJsZSgpO1xuXG4gICAgICAgIC8vIHRoaXMuX2NhbWVyYUNhcHR1cmVyRGVsZWdhdGUgPSBDYW1lcmFDYXB0dXJlckRlbGVnYXRlLmluaXRXaXRoT3duZXIobmV3IFdlYWtSZWYodGhpcykpO1xuXG4gICAgICAgIHRoaXMuX3Jvb21EZWxlZ2F0ZSA9IFJvb21EZWxlZ2F0ZS5pbml0V2l0aE93bmVyKG5ldyBXZWFrUmVmKHRoaXMpLCB0aGlzKTtcblxuICAgICAgICB0aGlzLl9wYXJ0aWNpcGFudERlbGVnYXRlID0gUmVtb3RlUGFydGljaXBhbnREZWxlZ2F0ZS5pbml0V2l0aE93bmVyKG5ldyBXZWFrUmVmKHRoaXMpLCB0aGlzKTtcblxuICAgIH1cblxuICAgIC8vIHB1YmxpYyByZW1vdmVfdmlkZW9fY2hhdF90d2lsaW9fbGlzdGVuZXJzKCk6IHZvaWQge1xuXG4gICAgLy8gICAgIHRoaXMuZXZlbnQub2ZmKCdvbkNvbm5lY3RlZCcpO1xuICAgIC8vICAgICB0aGlzLmV2ZW50Lm9mZignb25QYXJ0aWNpcGFudENvbm5lY3RlZCcpO1xuICAgIC8vICAgICB0aGlzLmV2ZW50Lm9mZignb25WaWRlb1RyYWNrQWRkZWQnKTtcbiAgICAvLyAgICAgdGhpcy5ldmVudC5vZmYoJ29uRGlzY29ubmVjdGVkJyk7XG4gICAgLy8gICAgIHRoaXMuZXZlbnQub2ZmKCdvbkNvbm5lY3RGYWlsdXJlJyk7XG4gICAgLy8gICAgIHRoaXMuZXZlbnQub2ZmKCdvblBhcnRpY2lwYW50RGlzY29ubmVjdGVkJyk7XG4gICAgLy8gICAgIHRoaXMuZXZlbnQub2ZmKCdvbkF1ZGlvVHJhY2tBZGRlZCcpO1xuICAgIC8vICAgICB0aGlzLmV2ZW50Lm9mZignb25WaWRlb1RyYWNrUmVtb3ZlZCcpO1xuICAgIC8vICAgICB0aGlzLmV2ZW50Lm9mZignb25BdWRpb1RyYWNrRW5hYmxlZCcpO1xuICAgIC8vICAgICB0aGlzLmV2ZW50Lm9mZignb25BdWRpb1RyYWNrRGlzYWJsZWQnKTtcbiAgICAvLyAgICAgdGhpcy5ldmVudC5vZmYoJ29uVmlkZW9UcmFja0VuYWJsZWQnKTtcbiAgICAvLyAgICAgdGhpcy5ldmVudC5vZmYoJ29uVmlkZW9UcmFja0Rpc2FibGVkJyk7XG4gICAgLy8gICAgIHRoaXMuZXZlbnQub2ZmKCdzdWJzY3JpYmVkVG9WaWRlb1RyYWNrUHVibGljYXRpb25Gb3JQYXJ0aWNpcGFudCcpO1xuICAgIC8vICAgICB0aGlzLmV2ZW50Lm9mZigndW5zdWJzY3JpYmVkRnJvbVZpZGVvVHJhY2tQdWJsaWNhdGlvbkZvclBhcnRpY2lwYW50Jyk7XG4gICAgLy8gfVxuXG5cblxuICAgIHN0YXJ0UHJldmlldygpIHtcbiAgICAgICAgLy8gVFZJQ2FtZXJhQ2FwdHVyZXIgaXMgbm90IHN1cHBvcnRlZCB3aXRoIHRoZSBTaW11bGF0b3IuXG4gICAgICAgIC8vIHRoaXMuY2FtZXJhID0gVFZJQ2FtZXJhQ2FwdHVyZXIuYWxsb2MoKS5pbml0V2l0aFNvdXJjZURlbGVnYXRlKFRWSUNhbWVyYUNhcHR1cmVTb3VyY2VGcm9udENhbWVyYSwgdGhpcy5fY2FtZXJhQ2FwdHVyZXJEZWxlZ2F0ZSk7XG4gICAgICAgIHRoaXMuY2FtZXJhID0gVFZJQ2FtZXJhQ2FwdHVyZXIuYWxsb2MoKS5pbml0V2l0aFNvdXJjZShUVklDYW1lcmFDYXB0dXJlU291cmNlRnJvbnRDYW1lcmEpO1xuXG4gICAgICAgIHRoaXMubG9jYWxWaWRlb1RyYWNrID0gVFZJTG9jYWxWaWRlb1RyYWNrLnRyYWNrV2l0aENhcHR1cmVyKHRoaXMuY2FtZXJhKTtcblxuICAgICAgICBpZiAoIXRoaXMubG9jYWxWaWRlb1RyYWNrKSB7XG5cbiAgICAgICAgICAgIHRoaXMubm90aWZ5KCdGYWlsZWQgdG8gYWRkIHZpZGVvIHRyYWNrJyk7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEFkZCByZW5kZXJlciB0byB2aWRlbyB0cmFjayBmb3IgbG9jYWwgcHJldmlld1xuICAgICAgICAgICAgdGhpcy5sb2NhbFZpZGVvVHJhY2suYWRkUmVuZGVyZXIodGhpcy5sb2NhbFZpZGVvVmlldyk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgZGlzY29ubmVjdCgpIHtcbiAgICAgICAgaWYgKHRoaXMucm9vbSkge1xuICAgICAgICAgICAgdGhpcy5yb29tLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyB0b2dnbGVfbG9jYWxfdmlkZW8oKSB7XG5cbiAgICAgICAgaWYgKHRoaXMubG9jYWxWaWRlb1RyYWNrKSB7XG5cbiAgICAgICAgICAgIHRoaXMubG9jYWxWaWRlb1RyYWNrLmVuYWJsZWQgPSAhdGhpcy5sb2NhbFZpZGVvVHJhY2suZW5hYmxlO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHB1YmxpYyB0b2dnbGVfbG9jYWxfYXVkaW8oKSB7XG5cbiAgICAgICAgaWYgKHRoaXMubG9jYWxBdWRpb1RyYWNrKSB7XG5cbiAgICAgICAgICAgIHRoaXMubG9jYWxBdWRpb1RyYWNrLmVuYWJsZWQgPSAhdGhpcy5sb2NhbEF1ZGlvVHJhY2suZW5hYmxlZDtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBjb25uZWN0X3RvX3Jvb20ocm9vbTogc3RyaW5nLCBvcHRpb25zOiB7IHZpZGVvOiBib29sZWFuLCBhdWRpbzogYm9vbGVhbiB9KTogdm9pZCB7XG5cbiAgICAgICAgaWYgKCF0aGlzLmFjY2Vzc1Rva2VuKSB7XG5cbiAgICAgICAgICAgIHRoaXMubm90aWZ5KCdQbGVhc2UgcHJvdmlkZSBhIHZhbGlkIHRva2VuIHRvIGNvbm5lY3QgdG8gYSByb29tJyk7XG5cbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJlcGFyZSBsb2NhbCBtZWRpYSB3aGljaCB3ZSB3aWxsIHNoYXJlIHdpdGggUm9vbSBQYXJ0aWNpcGFudHMuXG4gICAgICAgIGlmICghdGhpcy5sb2NhbEF1ZGlvVHJhY2sgJiYgb3B0aW9ucy5hdWRpbykge1xuICAgICAgICAgICAgdGhpcy5sb2NhbEF1ZGlvVHJhY2sgPSBUVklMb2NhbEF1ZGlvVHJhY2sudHJhY2soKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gQ3JlYXRlIGEgdmlkZW8gdHJhY2sgd2hpY2ggY2FwdHVyZXMgZnJvbSB0aGUgY2FtZXJhLlxuICAgICAgICBpZiAoIXRoaXMubG9jYWxWaWRlb1RyYWNrICYmIG9wdGlvbnMudmlkZW8pIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRQcmV2aWV3KCk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIHZhciBjb25uZWN0T3B0aW9ucyA9IFRWSUNvbm5lY3RPcHRpb25zLm9wdGlvbnNXaXRoVG9rZW5CbG9jayh0aGlzLmFjY2Vzc1Rva2VuLCAoYnVpbGRlcikgPT4ge1xuXG5cbiAgICAgICAgICAgIC8vIFVzZSB0aGUgbG9jYWwgbWVkaWEgdGhhdCB3ZSBwcmVwYXJlZCBlYXJsaWVyLlxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXVkaW8pXG4gICAgICAgICAgICAgICAgYnVpbGRlci5hdWRpb1RyYWNrcyA9IFt0aGlzLmxvY2FsQXVkaW9UcmFja107XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnZpZGVvKVxuICAgICAgICAgICAgICAgIGJ1aWxkZXIudmlkZW9UcmFja3MgPSBbdGhpcy5sb2NhbFZpZGVvVHJhY2tdO1xuXG4gICAgICAgICAgICAvLyBUaGUgbmFtZSBvZiB0aGUgUm9vbSB3aGVyZSB0aGUgQ2xpZW50IHdpbGwgYXR0ZW1wdCB0byBjb25uZWN0IHRvLiBQbGVhc2Ugbm90ZSB0aGF0IGlmIHlvdSBwYXNzIGFuIGVtcHR5XG4gICAgICAgICAgICAvLyBSb29tIGBuYW1lYCwgdGhlIENsaWVudCB3aWxsIGNyZWF0ZSBvbmUgZm9yIHlvdS4gWW91IGNhbiBnZXQgdGhlIG5hbWUgb3Igc2lkIGZyb20gYW55IGNvbm5lY3RlZCBSb29tLlxuICAgICAgICAgICAgYnVpbGRlci5yb29tTmFtZSA9IHJvb207XG5cblxuICAgICAgICB9KTtcblxuXG5cbiAgICAgICAgLy8gQ29ubmVjdCB0byB0aGUgUm9vbSB1c2luZyB0aGUgb3B0aW9ucyB3ZSBwcm92aWRlZC5cbiAgICAgICAgdGhpcy5yb29tID0gVHdpbGlvVmlkZW8uY29ubmVjdFdpdGhPcHRpb25zRGVsZWdhdGUoY29ubmVjdE9wdGlvbnMsIHRoaXMuX3Jvb21EZWxlZ2F0ZSk7XG5cbiAgICAgICAgLy8gW3NlbGYgbG9nTWVzc2FnZTpbTlNTdHJpbmcgc3RyaW5nV2l0aEZvcm1hdDpAXCJBdHRlbXB0aW5nIHRvIGNvbm5lY3QgdG8gcm9vbSAlQFwiLCBzZWxmLnJvb21UZXh0RmllbGQudGV4dF1dO1xuXG4gICAgfVxuXG5cbiAgICBjbGVhbnVwUmVtb3RlUGFydGljaXBhbnQoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW90ZVBhcnRpY2lwYW50KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5yZW1vdGVQYXJ0aWNpcGFudC52aWRlb1RyYWNrcy5jb3VudCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgdmlkZW9UcmFjayA9IHRoaXMucmVtb3RlUGFydGljaXBhbnQucmVtb3RlVmlkZW9UcmFja3NbMF0ucmVtb3RlVHJhY2s7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmlkZW9UcmFjay5yZW1vdmVSZW5kZXJlcih0aGlzLnJlbW90ZVZpZGVvVmlldyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMucmVtb3RlVmlkZW9WaWV3LnJlbW92ZUZyb21TdXBlcnZpZXcoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5vdGlmeShlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0aGlzLnJlbW90ZVBhcnRpY2lwYW50ID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5vdGlmeShyZWFzb246IHN0cmluZykge1xuXG4gICAgICAgIHRoaXMuZXZlbnQubm90aWZ5KHtcbiAgICAgICAgICAgIGV2ZW50TmFtZTogJ2Vycm9yJyxcbiAgICAgICAgICAgIG9iamVjdDogZnJvbU9iamVjdCh7XG4gICAgICAgICAgICAgICAgcmVhc29uOiByZWFzb25cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG5cblxuXG4gICAgcHVibGljIGNvbm5lY3RUb1Jvb21XaXRoTGlzdGVuZXIocm9vbSkgeyAvLyBydW5zIGZyb20gb25Db25uZWN0ZWQvZGlkQ29ubmVjdFRvUm9vbVxuXG4gICAgICAgIGlmIChyb29tLnJlbW90ZVBhcnRpY2lwYW50cy5jb3VudCA+IDApIHtcblxuICAgICAgICAgICAgdGhpcy5yZW1vdGVQYXJ0aWNpcGFudCA9IHJvb20ucmVtb3RlUGFydGljaXBhbnRzWzBdO1xuXG4gICAgICAgICAgICB0aGlzLnJlbW90ZVBhcnRpY2lwYW50LmRlbGVnYXRlID0gdGhpcy5fcGFydGljaXBhbnREZWxlZ2F0ZTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcGFydGljaXBhbnRfam9pbmVkX3Jvb20ocGFydGljaXBhbnQpIHtcblxuICAgICAgICBpZiAoIXRoaXMucmVtb3RlUGFydGljaXBhbnQpIHtcblxuICAgICAgICAgICAgdGhpcy5yZW1vdGVQYXJ0aWNpcGFudCA9IHBhcnRpY2lwYW50O1xuXG4gICAgICAgICAgICB0aGlzLnJlbW90ZVBhcnRpY2lwYW50LmRlbGVnYXRlID0gdGhpcy5fcGFydGljaXBhbnREZWxlZ2F0ZTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0X2FjY2Vzc190b2tlbih0b2tlbjogc3RyaW5nKSB7XG5cbiAgICAgICAgdGhpcy5hY2Nlc3NUb2tlbiA9IHRva2VuO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZV9yZW1vdGVfdmlldyh2aWRlb1RyYWNrLCBwYXJ0aWNpcGFudCk6IHZvaWQge1xuXG4gICAgICAgIGlmICh0aGlzLnJlbW90ZVBhcnRpY2lwYW50ID09IHBhcnRpY2lwYW50KSB7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdyZW1vdmVfcmVtb3RlX3ZpZXcnKTtcblxuICAgICAgICAgICAgdmlkZW9UcmFjay5yZW1vdmVSZW5kZXJlcih0aGlzLnJlbW90ZVZpZGVvVmlldyk7XG5cbiAgICAgICAgICAgIC8vIHRoaXMucmVtb3RlVmlkZW9WaWV3LnJlbW92ZUZyb21TdXBlcnZpZXcoKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkX3ZpZGVvX3RyYWNrKHZpZGVvVHJhY2spIHtcblxuICAgICAgICB2aWRlb1RyYWNrLmFkZFJlbmRlcmVyKHRoaXMucmVtb3RlVmlkZW9WaWV3KTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95X2xvY2FsX3ZpZGVvKCkge1xuXG4gICAgICAgIHRoaXMubG9jYWxWaWRlb1RyYWNrLnJlbW92ZVJlbmRlcmVyKHRoaXMubG9jYWxWaWRlb1ZpZXcpO1xuXG4gICAgfVxuXG5cbiAgICBwdWJsaWMgY29uZmlndXJlX2F1ZGlvKGVuYWJsZTogYm9vbGVhbik6IGFueSB7XG5cbiAgICAgICAgLy8gV2Ugd2lsbCBzaGFyZSBsb2NhbCBhdWRpbyBhbmQgdmlkZW8gd2hlbiB3ZSBjb25uZWN0IHRvIHJvb20uXG5cbiAgICAgICAgLy8gQ3JlYXRlIGFuIGF1ZGlvIHRyYWNrLlxuICAgICAgICBpZiAoIXRoaXMubG9jYWxBdWRpb1RyYWNrKSB7XG5cbiAgICAgICAgICAgIHRoaXMubG9jYWxBdWRpb1RyYWNrID0gVFZJTG9jYWxBdWRpb1RyYWNrLnRyYWNrKCk7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5sb2NhbEF1ZGlvVHJhY2spIHtcblxuICAgICAgICAgICAgICAgIHJldHVybiAnZmFpbGVkIHRvIGdldCBsb2NhbCBhdWRpbyc7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICB9XG5cblxuXG4gICAgZ2V0IGV2ZW50KCk6IE9ic2VydmFibGUge1xuXG4gICAgICAgIHJldHVybiBEZWxlZ2F0ZUV2ZW50cy5fZXZlbnQ7XG5cbiAgICB9XG5cblxuXG5cbn1cblxuIl19
