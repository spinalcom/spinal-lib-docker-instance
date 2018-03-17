const spinalcore = require('spinal-core-connectorjs');

// model.js

function DockerVolumeModel(port) {
    DockerVolumeModel.super(this);

    this.add_attr({
        port: port,
        previous: '',
        current: '', // TODO: change attr 'current' to 'last'
        backups: [],
        toRemove: []
    });

    this.addBackup = function () {
      let date = new Date().getTime()
      let backup = { date: date, name: 'spinalhub_memory_' + this.port.get() + '_backup_' + date, completed: false }
      this.backups.push(backup);
    }

    this.removeBackup = function (volumeName) { // TODO: check that volumeName is not current one
      let list = this.backups.get();

      this.toRemove.push(volumeName);

      let i = list.findIndex((b) => { return b.name == volumeName });

      this.backups.splice(i, 1);
    }

    this.rollBack = function () {
      let aux = this.previous.get();
      this.previous.set('');
      this.current.set(aux);
    }

    this.restoreBackup = function (backupName) {
      let aux = this.current.get();
      this.previous.set(aux);
      this.current.set(backupName);
    }
}

spinalcore.extend(DockerVolumeModel, Model);

function DockerImageModel(name) {
    DockerImageModel.super(this);

    if (!name) name = 'missing_image_name';

    this.add_attr({
        name: name,
        containers: [],
        volumes: []
    });

    this.newContainer = function (port, restoreVolume = false) {
      /*
        containers' status:
        0: new (starting)
        1: started
        2: stopped
        3: to remove
        4: error
        5: to start
        6: to stop
      */

      let containerName = this.name.get().replace(/[^a-zA-Z0-9_.-]/g, "_") + '-' + port;

      let volume = containerName + '_volume';

      this.containers.push({ name: containerName, port: port, volume: volume, status: 0, restoreVolume: restoreVolume });
    }

    this.removeContainer = function (i) {
      this.containers[i].status.set(3);
    }

    this.startContainer = function(i) {
      this.containers[i].status.set(5);
    }

    this.stopContainer = function(i) {
      this.containers[i].status.set(6);
    }

    this.addVolume = function (i) {
      /*
        volumes' status:
        0: new (starting)
        1: created

        3: to remove
        4: error
      */
      let c = this.containers[i].get();
      let now = new Date();

      let volumeName = c.volume + '_' + now.toISOString().replace(/[^a-zA-Z0-9_.-]/g, "_")

      this.volumes.push({ name: volumeName, container: c.name, src: c.volume, date: now.getTime(), status: 0 });
    }

    this.removeVolume = function (i) {
      this.volumes[i].status.set(3);
    }
}

spinalcore.extend(DockerImageModel, Model);

module.exports = {
  DockerVolumeModel: DockerVolumeModel,
  DockerImageModel: DockerImageModel
}
