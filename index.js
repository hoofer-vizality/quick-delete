import { Plugin } from '@vizality/entities';
import { patch, unpatch } from '@vizality/patcher';
import { getModule, messages, constants } from '@vizality/webpack';

export default class MentionUtilities extends Plugin {
    async start () {
        // modules
        const Message = await getModule(m => m?.default?.displayName == "Message");
        const getChannelPermissions = await getModule([ 'getChannelPermissions' ]);
        const getCurrentUser = await getModule([ 'getCurrentUser' ]);

        // injectors
        patch('Message', Message, 'default', (args, res) => {
            const message = args[0].childrenAccessories.props.message;
            const channel = args[0].childrenAccessories.props.channel;
            const deletePerm = getChannelPermissions.can(constants.Permissions.MANAGE_MESSAGES, channel);

            if (res?.props) {
                res.props.children.props.onClick = function(e){

                    if (e?.ctrlKey && !(deletePerm || getCurrentUser.getCurrentUser().id === message.author.id)){
                        vizality.api.notices.sendToast(`delete-notif-${Date.now()^12345}`, {
                            header: "Insufficient Permissions",
                            timeout: 3000,
                            content: "You do not have permissions to delete this message.",
                            position: "BottomLeft"
                        })
                        return res;
                    }

                    if (e?.ctrlKey){
                        messages.deleteMessage(channel.id, message.id);
                    }
                }
            }
            return res;
        });

    }

    stop () {
        unpatch('Message')
    }
}
