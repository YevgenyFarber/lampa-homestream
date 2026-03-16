import { PLUGIN_COMPONENT } from './constants';
import { getUnmatched, streamUrl } from './api-client';
import { formatFileSize, playExternal } from './utils';

export function UnmatchedComponent(object) {
    var html = Lampa.Template.js(PLUGIN_COMPONENT + '_main');
    var body = html.find('.lm-main__body');
    var scroll;

    this.create = function () {
        var self = this;
        this.activity.loader(true);

        getUnmatched()
            .then(function (data) {
                self.activity.loader(false);
                renderFiles(data.unmatched || data, self);
            })
            .catch(function (err) {
                self.activity.loader(false);
                var errEl = Lampa.Template.js(PLUGIN_COMPONENT + '_error');
                errEl.find('.lm-error__text').text(err.message);
                errEl.find('.lm-error__retry').text(Lampa.Lang.translate('local_media_retry'));
                errEl.find('.lm-error__retry').on('hover:enter', function () {
                    body.empty();
                    self.create();
                });
                body.append(errEl);
            });
    };

    function renderFiles(files, self) {
        scroll = new Lampa.Scroll({ mask: true, over: true });
        body.append(scroll.render());

        if (!files || !files.length) {
            var empty = new Lampa.Empty({ descr: Lampa.Lang.translate('local_media_empty_library') });
            scroll.append(empty.render(true));
            self.activity.toggle();
            return;
        }

        files.forEach(function (file) {
            var item = Lampa.Template.js(PLUGIN_COMPONENT + '_unmatched_item');
            item.find('.lm-unmatched__name').text(file.file_name || file.file_path || 'Unknown');
            item.find('.lm-unmatched__size').text(formatFileSize(file.file_size));

            item.on('hover:enter', function () {
                playExternal(streamUrl(file.id), file.file_name || file.file_path);
            });

            item.on('hover:focus', function () {
                scroll.update(item);
            });

            scroll.append(item);
        });

        self.activity.toggle();
    }

    this.start = function () {
        if (Lampa.Activity.active() && Lampa.Activity.active().activity !== this.activity) return;

        var target = scroll ? scroll.render() : html;

        Lampa.Controller.add('content', {
            link: this,
            toggle: function () {
                Lampa.Controller.collectionSet(target);
                Lampa.Controller.collectionFocus(false, target);
            },
            left: function () {
                if (typeof Navigator !== 'undefined' && Navigator.canmove('left')) Navigator.move('left');
                else Lampa.Controller.toggle('menu');
            },
            up: function () {
                if (typeof Navigator !== 'undefined' && Navigator.canmove('up')) Navigator.move('up');
                else Lampa.Controller.toggle('head');
            },
            right: function () {
                if (typeof Navigator !== 'undefined' && Navigator.canmove('right')) Navigator.move('right');
            },
            down: function () {
                if (typeof Navigator !== 'undefined' && Navigator.canmove('down')) Navigator.move('down');
            },
            back: function () { Lampa.Activity.backward(); }
        });
        Lampa.Controller.toggle('content');
    };

    this.pause = function () {};
    this.stop = function () {};
    this.render = function () { return html; };
    this.destroy = function () {
        if (scroll) scroll.destroy();
        html.remove();
    };
}
